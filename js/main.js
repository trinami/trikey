//save salts, 
let encodedPublicKeys = [];
let encodedPrivateKeys = [];
let derivatedPasswordsAndSalts;

document.getElementById('startButton').addEventListener('click', () => {
    setStep(0);
    
    const entropy = [];
    const MAX_LEN = 256; // size of entropy's array
    const ivBar = document.getElementById('iv-bar');
    
    document.addEventListener('mousemove', function(e) {
        if(entropy.length >= MAX_LEN) {
            return;
        }

        const now = Date.now();
        if(now >= 1 && (now % 10) !== 0) {
            return;
        }

        const iw = window.innerWidth;
        const ih = window.innerHeight;
        const iwPlusIh = iw + ih;
        const px = e.pageX;
        const py = e.pageY;
        const pxPlusPy = px + py;
        const ret = Math.round((pxPlusPy / iwPlusIh) * 255) % 4;
        entropy.push(ret);

        ivBar.value = entropy.length;

        if (entropy.length >= MAX_LEN) {
            let randomBytes = intArrayToUint8Array(entropy, 4)
            qrng.updatePool(randomBytes);

            setStep(2);
        }
    });
});

document.getElementById('set-password').addEventListener('click', async () => {
    setStep(0);
    await delay(20);

    derivatedPasswordsAndSalts = await generateDerivatedPasswords(document.getElementById('password').value);
    
    await delay(20);
    setStep(3);
});


document.getElementById('generateKey').addEventListener('click', async () => {
    setStep(0);
    await delay(20);

    await getKeyPairAndUpdateProgressBar(() => sphincs.keyPair());
    await delay(20);
    await getKeyPairAndUpdateProgressBar(() => ntru.keyPair());
    await delay(20);
    await getKeyPairAndUpdateProgressBar(() => kyber.keyPair());
    await delay(20);
    await getKeyPairAndUpdateProgressBar(() => sidh.keyPair());
    await delay(20);
    await getKeyPairAndUpdateProgressBar(() => dilithium.keyPair());
    await delay(20);
    await getKeyPairAndUpdateProgressBar(() => falcon.keyPair());
    await delay(20);
    await getKeyPairAndUpdateProgressBar(() => mceliece.keyPair());
    await delay(20);
    await getKeyPairAndUpdateProgressBar(() => eccryptoJS.generateKeyPair());
    await delay(20);
    await getKeyPairAndUpdateProgressBar(() => generateRsaKey());
    await delay(20);
    
    let pubkey = '---BEGIN PUBLIC KEY---\n' + uint8ArrayToBase64(encodedPublicKeys) + '\n---END PUBLIC KEY---';
    document.getElementById('publickey').value = pubkey;
    
    const encryptedPrivatekeyBase64 = await encryptPrivateKey(encodedPrivateKeys, derivatedPasswordsAndSalts);
    let privkey = '---BEGIN ENCRYPTED PRIVATE KEY---\n' + encryptedPrivatekeyBase64 + '\n---END ENCRYPTED PRIVATE KEY---';
    document.getElementById('privatekey').value = privkey;
    
    document.getElementById('trikey-bar').value += 1;
    setStep(4);
});

document.getElementById('download-privkey').addEventListener('click', async () => {
    downloadTextareaContent(document.getElementById('privatekey'), 'trikey.priv');
});

document.getElementById('download-pubkey').addEventListener('click', async () => {
    downloadTextareaContent(document.getElementById('publickey'), 'trikey.pub');
});

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function setStep(step)
{
    const generate = document.getElementById('startButton');
    const setPassword = document.getElementById('set-password');
    const password = document.getElementById('password');
    const generateKeys = document.getElementById('generateKey');
    const downloadPubkey = document.getElementById('download-pubkey');
    const downloadPrivkey = document.getElementById('download-privkey');
    
    generate.disabled = true;
    setPassword.disabled = true;
    password.disabled = true;
    generateKeys.disabled = true;
    downloadPrivkey.disabled = true;
    downloadPubkey.disabled = true;
    
    switch(step)
    {
        case 1:
            generate.disabled = false;
        break;
        case 2:
            setPassword.disabled = false;
            password.disabled = false;
        break;
        case 3:
            generateKeys.disabled = false;
        break;
        case 4:
            downloadPrivkey.disabled = false;
            downloadPubkey.disabled = false;
        break;
    }
}

async function getKeyPairAndUpdateProgressBar(keyPairFunction) {
    const trikeybar = document.getElementById('trikey-bar');
    const keyPair = await keyPairFunction();
    trikeybar.value += 1;
    //console.log(keyPair);
    encodedPublicKeys = new Uint8Array([...encodedPublicKeys, ...encodeUint8ArrayWithLength(keyPair.publicKey)]);
    encodedPrivateKeys = new Uint8Array([...encodedPrivateKeys, ...encodeUint8ArrayWithLength(keyPair.privateKey)]);
}

function downloadTextareaContent(textarea, filename) {

    const textareaContent = textarea.value;

    const blob = new Blob([textareaContent], { type: 'text/plain' });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
}