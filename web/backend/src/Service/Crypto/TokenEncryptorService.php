<?php

namespace App\Service\Crypto;

use RuntimeException;

class TokenEncryptorService
{
    private const ALGO = 'aes-256-gcm';
    private const IV_LENGTH = 12;
    private const TAG_LENGTH = 16;

    private string $key;

    public function __construct(string $encryptionKey)
    {
        $decoded = base64_decode($encryptionKey, true);
        if (false === $decoded || 32 !== strlen($decoded)) {
            throw new RuntimeException('APP_ENCRYPTION_KEY must be a base64-encoded 32-byte key.');
        }
        $this->key = $decoded;
    }

    public function encrypt(string $plaintext): string
    {
        $iv = random_bytes(self::IV_LENGTH);
        $tag = '';
        $ciphertext = openssl_encrypt($plaintext, self::ALGO, $this->key, OPENSSL_RAW_DATA, $iv, $tag, '', self::TAG_LENGTH);

        if (false === $ciphertext) {
            throw new RuntimeException('Encryption failed.');
        }

        return base64_encode($iv.$ciphertext.$tag);
    }

    public function decrypt(string $encoded): string
    {
        $raw = base64_decode($encoded, true);
        if (false === $raw || strlen($raw) < self::IV_LENGTH + self::TAG_LENGTH + 1) {
            throw new RuntimeException('Invalid encrypted token format.');
        }

        $iv = substr($raw, 0, self::IV_LENGTH);
        $tag = substr($raw, -self::TAG_LENGTH);
        $ciphertext = substr($raw, self::IV_LENGTH, -self::TAG_LENGTH);

        $plaintext = openssl_decrypt($ciphertext, self::ALGO, $this->key, OPENSSL_RAW_DATA, $iv, $tag);

        if (false === $plaintext) {
            throw new RuntimeException('Decryption failed — token may be corrupted or key mismatch.');
        }

        return $plaintext;
    }
}
