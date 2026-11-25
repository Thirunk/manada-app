namespace Manada.Domain.Identity;

/// <summary>
/// A server-side browser session. The encrypted authentication ticket (including
/// access and refresh tokens) lives here; the browser only holds an opaque key.
/// </summary>
public sealed class AuthSession
{
    private AuthSession() { }

    public AuthSession(string key, Guid userId, byte[] protectedTicket, DateTimeOffset expiresUtc)
    {
        Key = key;
        UserId = userId;
        ProtectedTicket = protectedTicket;
        CreatedUtc = DateTimeOffset.UtcNow;
        ExpiresUtc = expiresUtc;
    }

    public string Key { get; private set; } = string.Empty;

    public Guid UserId { get; private set; }

    public byte[] ProtectedTicket { get; private set; } = [];

    public DateTimeOffset CreatedUtc { get; private set; }

    public DateTimeOffset ExpiresUtc { get; private set; }

    public DateTimeOffset? RevokedUtc { get; private set; }

    public uint RowVersion { get; private set; }

    public bool IsRevoked => RevokedUtc is not null;

    public void Replace(byte[] protectedTicket, DateTimeOffset expiresUtc)
    {
        ProtectedTicket = protectedTicket;
        ExpiresUtc = expiresUtc;
    }

    public void Revoke() => RevokedUtc ??= DateTimeOffset.UtcNow;
}
