class QuantumRandomNumberGenerator {
	constructor() {
		this.pool = this.getStoredRandomNumbers();
		if (!this.pool) {
            this.fetchAndStoreRandomNumbers();
		}
	}
  
	async fetchAndStoreRandomNumbers() {
		try {
            const response = await fetch('https://qrng.anu.edu.au/API/jsonI.php?length=64&type=uint8');
            const data = await response.json();
            const randomNumbers = data.data;
            localStorage.setItem('randomNumbers', JSON.stringify(randomNumbers));
            this.pool = randomNumbers;
		} catch (error) {
            this.pool = this.generateRandomUint8Array(64);
            localStorage.setItem('randomNumbers', JSON.stringify(this.pool));
		}
	}


    async sha512(dataUint8Array) {
        const hashBuffer = await crypto.subtle.digest('SHA-512', dataUint8Array);
      
        const hashUint8Array = new Uint8Array(hashBuffer);
      
        return hashUint8Array;
    }
    
	getStoredRandomNumbers() {
		const storedNumbers = localStorage.getItem('randomNumbers');

		return storedNumbers ? JSON.parse(storedNumbers) : null;
	}
  
	async get32Bytes() {
		this.pool = xorUint8Arrays(this.pool, this.generateRandomUint8Array(64));
		const output = await this.sha512(this.pool);

		return output.slice(0, 32);
	}
  
	updatePool(update) {
		this.pool = xorUint8Arrays(this.pool, update);
	}
  
    generateRandomUint8Array(length) {
        const randomBytesArray = new Uint8Array(length);
        window.crypto.getRandomValues(randomBytesArray);
        
        return randomBytesArray;
    }
}

const qrng = new QuantumRandomNumberGenerator();