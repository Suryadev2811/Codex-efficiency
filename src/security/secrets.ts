const SECRET_PATTERNS = [
    // AWS
    /(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}/g,
    // Google Cloud
    /AIza[0-9A-Za-z-_]{35}/g,
    // General Bearer / Auth
    /Bearer\s+[A-Za-z0-9\-\._~\+\/]{16,}=*/gi,
    /Authorization:\s+Basic\s+[A-Za-z0-9\+\/]{16,}=*/gi,
    // Generic tokens/keys that might appear in URLs or outputs
    /ghp_[a-zA-Z0-9]{36}/g, // GitHub Personal Access Token
    /glpat-[a-zA-Z0-9\-]{20}/g, // GitLab
    /xox[baprs]-[0-9]{12}-[0-9]{12}-[a-zA-Z0-9]{24}/g, // Slack
    // Passwords in URLs
    /:\/\/[^:\/?#]+:([^@\/?#]+)@/g,
];

export function redactSecrets(text: string): string {
    let redacted = text;
    for (const pattern of SECRET_PATTERNS) {
        redacted = redacted.replace(pattern, (match, p1) => {
            // If it's the URL password pattern (which has a capture group), we only want to redact the password group
            if (p1 && match.includes(p1) && p1 !== match) {
                return match.replace(p1, "***REDACTED***");
            }
            return "***REDACTED***";
        });
    }
    return redacted;
}
