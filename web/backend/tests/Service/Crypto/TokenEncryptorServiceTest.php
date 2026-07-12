<?php

namespace App\Tests\Service\Crypto;

use App\Service\Crypto\TokenEncryptorService;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;
use RuntimeException;

#[Group('unit')]
class TokenEncryptorServiceTest extends TestCase
{
    // 32 octets nuls encodés en base64 → clé AES-256 valide
    private const VALID_KEY = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';

    private TokenEncryptorService $service;

    protected function setUp(): void
    {
        $this->service = new TokenEncryptorService(self::VALID_KEY);
    }

    // ===== Constructeur =====

    public function testConstructorRejectsNonBase64Key(): void
    {
        $this->expectException(RuntimeException::class);
        new TokenEncryptorService('pas-du-base64-!!!');
    }

    public function testConstructorRejectsKeyWithWrongDecodedLength(): void
    {
        $this->expectException(RuntimeException::class);
        // 16 octets encodés en base64 → trop court pour AES-256
        new TokenEncryptorService(base64_encode(str_repeat("\x00", 16)));
    }

    // ===== encrypt() =====

    public function testEncryptReturnsValidBase64(): void
    {
        $result = $this->service->encrypt('user@example.com');

        $this->assertNotEmpty($result);
        $this->assertNotFalse(base64_decode($result, true), 'Le résultat doit être du base64 valide');
    }

    public function testEncryptProducesUniqueOutputsForSamePlaintext(): void
    {
        // L'IV aléatoire garantit que deux chiffrements du même texte diffèrent
        $first  = $this->service->encrypt('access_token_abc');
        $second = $this->service->encrypt('access_token_abc');

        $this->assertNotEquals($first, $second);
    }

    // ===== Round-trip decrypt(encrypt(x)) =====

    public function testRoundTripWithEmailAddress(): void
    {
        $plaintext = 'mazlai@example.com';
        $this->assertSame($plaintext, $this->service->decrypt($this->service->encrypt($plaintext)));
    }

    public function testRoundTripWithOAuthToken(): void
    {
        $token = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.very_long_discord_access_token_string';
        $this->assertSame($token, $this->service->decrypt($this->service->encrypt($token)));
    }

    public function testRoundTripWithSpecialCharacters(): void
    {
        $plaintext = "user+tag@éxâmplé.com\n\t\"';--DROP TABLE users--";
        $this->assertSame($plaintext, $this->service->decrypt($this->service->encrypt($plaintext)));
    }

    public function testRoundTripWithLongToken(): void
    {
        $plaintext = str_repeat('MazWorld_token_', 100);
        $this->assertSame($plaintext, $this->service->decrypt($this->service->encrypt($plaintext)));
    }

    // ===== decrypt() — erreurs =====

    public function testDecryptThrowsOnGarbageInput(): void
    {
        $this->expectException(RuntimeException::class);
        // Le tiret n'est pas dans l'alphabet base64 strict
        $this->service->decrypt('not-valid-base64-!!!');
    }

    public function testDecryptThrowsOnTooShortPayload(): void
    {
        $this->expectException(RuntimeException::class);
        // 10 octets < IV(12) + TAG(16) + 1 octet minimum de ciphertext
        $this->service->decrypt(base64_encode(str_repeat("\x00", 10)));
    }

    public function testDecryptThrowsOnTamperedCiphertext(): void
    {
        $encrypted = $this->service->encrypt('données sensibles');
        $raw = base64_decode($encrypted, true);

        // Corrompt un octet dans la zone ciphertext (après les 12 octets d'IV)
        $raw[15] = chr(ord($raw[15]) ^ 0xFF);

        $this->expectException(RuntimeException::class);
        $this->service->decrypt(base64_encode($raw));
    }

    public function testDecryptThrowsWithDifferentKey(): void
    {
        $encrypted = $this->service->encrypt('secret');

        $otherService = new TokenEncryptorService(base64_encode(str_repeat("\xFF", 32)));

        $this->expectException(RuntimeException::class);
        $otherService->decrypt($encrypted);
    }
}
