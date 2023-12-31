# Trikey Generator

    RNG:
	The Trikey Generator has a cryptographic pseudo-random number generator (PRNG)
        that leverages a combination of Browser/OS True Random Number Generator (TRNG)
        and Quantum Random Number Generator (QRNG) initialized numbers.

    Initialization:
	Gets QRNG numbers from https://qrng.anu.edu.au/
        Collects mouse movement and append to PRNG.

    Hashing:
        Utilizes Argon2id to generate 5 sets of 64-byte hashes.
        Processes the 5 sets of 64-byte hashes using 2x RIPEMD-160 (to achieve a 32-byte key size), 1x Blake3, 1x SHA3-256, and 1x Whirlpool.

    Key Extraction:
        Extracts 4 independent keys from the (5)(double) hashed results.

    Key Pair Generation:
        Generates:
            7 PQ key pairs (SPHINCS, NTRU, Kyber Crystals, SIDH, D-Lithium Crystal, Falcon, McEliece),
            1 ECC key, and
            1 RSA 4096 key.

    Encryption:
        Encrypts all the private keys collectively with the 4 independent keys using the following algorithms:
            AES-256-GCM
            Serpent-CBC
            Twofish-CBC
            ChaCha20

    Initialization Vectors (IV):
        IVs are appended after each encryption step.


The primary goal of the Trikey Generator is to produce certificates that are resilient in the post-quantum and AI era, minimizing dependence on single points of failure. The aspiration is for these certificates to remain unbroken until the year 2050, thereby ensuring long-term security.
