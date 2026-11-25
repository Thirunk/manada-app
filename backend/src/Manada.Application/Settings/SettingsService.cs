using Manada.Application.Abstractions;
using Manada.Application.Common;
using Manada.Domain.Audit;
using Manada.Domain.Identity;
using Manada.Domain.Settings;
using Microsoft.EntityFrameworkCore;

namespace Manada.Application.Settings;

public sealed record SettingDto(string Key, string Value, DateTimeOffset UpdatedUtc, uint RowVersion);

/// <summary>
/// System settings. Only allowlisted keys with validated values can be changed, so the
/// table cannot be used to store arbitrary data or secrets.
/// </summary>
public sealed class SettingsService(IAppDbContext db, IPermissionService permissions)
{
    private static readonly IReadOnlyDictionary<string, string[]> Allowed =
        new Dictionary<string, string[]>();

    public async Task<IReadOnlyList<SettingDto>> ListAsync(ActorContext actor, CancellationToken ct = default)
    {
        await RequireAsync(actor, ct);
        return await db.SystemSettings.AsNoTracking()
            .OrderBy(s => s.Key)
            .Select(s => new SettingDto(s.Key, s.Value, s.UpdatedUtc, s.RowVersion))
            .ToListAsync(ct);
    }

    public async Task<SettingDto> SetAsync(ActorContext actor, string key, string value, uint? expectedRowVersion, CancellationToken ct = default)
    {
        await RequireAsync(actor, ct);

        if (!Allowed.TryGetValue(key, out var allowedValues))
        {
            throw new NotFoundException("The setting was not found.");
        }

        if (!allowedValues.Contains(value))
        {
            throw new ConflictException("The value is not allowed for this setting.");
        }

        var setting = await db.SystemSettings.FirstOrDefaultAsync(s => s.Key == key, ct);
        if (setting is null)
        {
            setting = new SystemSetting(key, value, actor.UserId);
            db.SystemSettings.Add(setting);
        }
        else
        {
            if (expectedRowVersion is { } version && version != setting.RowVersion)
            {
                throw new ConflictException("The setting was changed by someone else. Reload it and try again.");
            }

            setting.Update(value, actor.UserId);
        }

        db.AuditEvents.Add(new AuditEvent("settings.changed", AuditOutcome.Success, actor.UserId, actor.Subject, "Setting", key, actor.CorrelationId, $"value={value}"));

        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException)
        {
            throw new ConflictException("The setting was changed by someone else. Reload it and try again.");
        }

        return new SettingDto(setting.Key, setting.Value, setting.UpdatedUtc, setting.RowVersion);
    }

    private async Task RequireAsync(ActorContext actor, CancellationToken ct)
    {
        if (!await permissions.HasPermissionAsync(actor.UserId, PermissionCodes.SettingsManage, ct))
        {
            throw new ForbiddenException("You do not have permission to manage system settings.");
        }
    }
}
