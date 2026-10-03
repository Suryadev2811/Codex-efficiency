import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { redactSecrets } from '../../src/security/secrets';

describe('Security / Redaction', () => {
    it('should redact AWS keys', () => {
        const text = "Here is my key: AKIAIOSFODNN7EXAMPLE";
        const result = redactSecrets(text);
        assert.strictEqual(result, "Here is my key: ***REDACTED***");
    });

    it('should redact Bearer tokens', () => {
        const text = "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
        const result = redactSecrets(text);
        assert.strictEqual(result, "Authorization: ***REDACTED***");
    });

    it('should redact basic auth URLs', () => {
        const text = "Connect to db at postgres://user:supersecretpassword@localhost:5432/db";
        const result = redactSecrets(text);
        assert.strictEqual(result, "Connect to db at postgres://user:***REDACTED***@localhost:5432/db");
    });

    it('should leave non-secrets alone', () => {
        const text = "const x = 'AKIA is an acronym';\nlet y = 'Bearer of bad news'";
        const result = redactSecrets(text);
        assert.strictEqual(result, text);
    });
});
