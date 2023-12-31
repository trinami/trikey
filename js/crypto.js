async function generateRsaKey() {
    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: 'RSA-OAEP',
            modulusLength: 8192,
            publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
            hash: 'SHA-512',
        },
        true,
        ['encrypt', 'decrypt']
    );

    const privateKey = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
    const publicKey = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
    
    return {publicKey: new Uint8Array(publicKey), privateKey: new Uint8Array(privateKey)};
}

function hash(algo, data)
{
    algo.init();
    algo.update(data);
    
    return algo.digest('binary');
}

async function aesGcmEncrypt(key, plaintext) {
	const iv = (await qrng.get32Bytes()).slice(0, 12) // 96-bit IV

	const importedKey = await crypto.subtle.importKey(
		'raw',
		key,
		{ name: 'AES-GCM' },
		false,
		['encrypt']
	);

	const ciphertext = await crypto.subtle.encrypt(
		{
		name: 'AES-GCM',
		iv: iv,
		},
		importedKey,
		plaintext
	);

	const encryptedData = new Uint8Array(iv.length + ciphertext.byteLength);
	encryptedData.set(iv, 0);
	encryptedData.set(new Uint8Array(ciphertext), iv.length);

	return encryptedData;
}

async function aesGcmDecrypt(key, encryptedData) {
	const iv = encryptedData.slice(0, 12);
	const ciphertext = encryptedData.slice(12);

	const importedKey = await crypto.subtle.importKey(
		'raw',
		key,
		{ name: 'AES-GCM' },
		false,
		['decrypt']
	);

	const decryptedArrayBuffer = await crypto.subtle.decrypt(
		{
		name: 'AES-GCM',
		iv: iv,
		},
		importedKey,
		ciphertext
	);

	const decryptedUint8Array = new Uint8Array(decryptedArrayBuffer);

	return decryptedUint8Array;
}

async function encryptPrivateKey(encodedPrivateKeys, derivatedPasswordsAndSalts)
{
    //chacha20 nonce
    chacha20IV = (await qrng.get32Bytes()).subarray(0, 12);
    
    const chacha20encrypted = await (new JSChaCha20(derivatedPasswordsAndSalts.derivatedHashedPasswords[0], chacha20IV)).encrypt(encodedPrivateKeys);
    const chacha20package = new Uint8Array([...chacha20IV, ...derivatedPasswordsAndSalts.generatedSalts[0], ...derivatedPasswordsAndSalts.generatedSalts[1], ...chacha20encrypted]);
    
    let twofishEncrypt = Cipher.create(Cipher.TWOFISH, Cipher.ENCRYPT, Cipher.CBC, Cipher.PKCS7)//////////////
    const twofishEncrypted = twofishEncrypt.execute(Array.from(derivatedPasswordsAndSalts.derivatedHashedPasswords[1]), Array.from(chacha20package));
    const twofishPackage = new Uint8Array([...derivatedPasswordsAndSalts.generatedSalts[2], ...twofishEncrypted]);

    let serpentEncrypt = Cipher.create(Cipher.SERPENT, Cipher.ENCRYPT, Cipher.CBC, Cipher.PKCS7)//////////////
    const serpentEncrypted = serpentEncrypt.execute(Array.from(derivatedPasswordsAndSalts.derivatedHashedPasswords[2]), Array.from(twofishPackage));
    const serpentPackage = new Uint8Array([...derivatedPasswordsAndSalts.generatedSalts[3], ...serpentEncrypted]);

    //more encryption in future?

    const aesEncrypted = await aesGcmEncrypt(derivatedPasswordsAndSalts.derivatedHashedPasswords[3], Uint8Array.from(serpentEncrypted));
    const aesPackage = new Uint8Array([...derivatedPasswordsAndSalts.generatedSalts[4], ...aesEncrypted]);
    const aesEncryptedPackageBase64 = uint8ArrayToBase64(aesPackage);

    return aesEncryptedPackageBase64;
}

//returns 5 salts(2xripemd because too short) and 4 hashes for chacha20, twofish, serpent, aes
async function generateDerivatedPasswords(password)
{
    let generatedSalts = [];
    let derivatedPasswords = [];
    let derivatedHashedPasswords = [];

    const ripemd160_hash = await hashwasm.createRIPEMD160();
    const blake3_hash = await hashwasm.createBLAKE3();
    const whirlpool_hash = await hashwasm.createWhirlpool();
    const sha3_hash = await hashwasm.createSHA3();
    
    const trikeybar = document.getElementById('password-bar');
    for (let i = 0; i < 5; i++) {
        generatedRandomBytes = new Uint8Array([...await qrng.get32Bytes(), ...await qrng.get32Bytes()]);
        const key = await hashwasm.argon2id({
            password,
            salt: generatedRandomBytes,
            parallelism: 1,
            iterations: 18,
            memorySize: 1024*100,//100MB
            
            hashLength: 64,
            outputType: 'binary',
        });
        await delay(20);
        generatedSalts.push(generatedRandomBytes);
        derivatedPasswords.push(key);
        trikeybar.value += 1;
        await delay(20);
    }

    const ripemd1 = hash(ripemd160_hash, derivatedPasswords[0]);
    const ripemd2 = hash(ripemd160_hash, derivatedPasswords[1]);

    const ripemd = new Uint8Array([...ripemd1, ...ripemd2]);
    derivatedHashedPasswords.push(ripemd.subarray(0, 32));
    
    const blake3 = hash(blake3_hash, derivatedPasswords[2]);
    derivatedHashedPasswords.push(blake3);
    
    const whirlpool = hash(whirlpool_hash, derivatedPasswords[3]);
    derivatedHashedPasswords.push(whirlpool.subarray(0, 32));
    
    const sha3 = hash(sha3_hash, derivatedPasswords[4]);
    derivatedHashedPasswords.push(sha3.subarray(0, 32));

    return {derivatedHashedPasswords, generatedSalts}
}