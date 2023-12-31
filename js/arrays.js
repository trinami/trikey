function xorUint8Arrays(arr1, arr2) {
    if(arr1.length !== arr2.length) {
        throw new Error();
    }

    const result = new Uint8Array(arr1.length);

    for(let i = 0; i < arr1.length; i++) {
        result[i] = arr1[i] ^ arr2[i];
    }

    return result;
}

function intArrayToUint8Array(intArray, range) {
    const uint8Array = new Uint8Array(Math.ceil(intArray.length / (8 / Math.log2(range))));

    for(let i = 0; i < intArray.length; i++) {
        const byteIndex = Math.floor(i / (8 / Math.log2(range)));
        const bitOffset = (i % (8 / Math.log2(range))) * Math.log2(range);

        uint8Array[byteIndex] |= (intArray[i] << bitOffset);
    }

    return uint8Array;
}

function uint8ArrayToBase64(bytes) {
    let binary = '';
    let len = bytes.byteLength;
    for(let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    
    return window.btoa(binary);
}

function encodeUint8ArrayWithLength(array) {
    const lengthPrefix = new Uint8Array(4);
    new DataView(lengthPrefix.buffer).setUint32(0, array.length, true);

    return new Uint8Array([...lengthPrefix, ...array]);
}

// Function to decode a Uint8Array with a 4-byte length prefix
function decodeUint8ArrayWithLength(encodedArray) {
    const lengthPrefix = encodedArray.slice(0, 4);
    const length = new DataView(lengthPrefix.buffer).getUint32(0, true);

    return encodedArray.slice(4, 4 + length);
}