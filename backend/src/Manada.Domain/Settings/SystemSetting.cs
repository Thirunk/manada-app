namespace Manada.Domain.Settings;

/// <summary>A system-level setting. Secrets must never be stored here.</summary>
public sealed class SystemSetting
{
    private SystemSetting() { }

    public SystemSetting(string key, string value, Guid? updatedByUserId)
    {
        Key = key;
        Value = value;
        UpdatedByUserId = updatedByUserId;
        UpdatedUtc = DateTimeOffset.UtcNow;
    }

    public string Key { get; private set; } = string.Empty;

    public string Value { get; private set; } = string.Empty;

    public Guid? UpdatedByUserId { get; private set; }

    public DateTimeOffset UpdatedUtc { get; private set; }

    public uint RowVersion { get; private set; }

    public void Update(string value, Guid? updatedByUserId)
    {
        Value = value;
        UpdatedByUserId = updatedByUserId;
        UpdatedUtc = DateTimeOffset.UtcNow;
    }
}
