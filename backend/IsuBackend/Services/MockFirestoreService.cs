using IsuBackend.Models;
using System.Text.Json;
using IsuBackend.DTOs;

namespace IsuBackend.Services;

public class MockFirestoreService : IFirestoreOperations
{
    private readonly string _dataDir;
    private readonly object _lock = new();

    public MockFirestoreService()
    {
        _dataDir = Path.Combine(Path.GetTempPath(), "isu-mock-firestore");
        Directory.CreateDirectory(_dataDir);
        Console.WriteLine($"[DEVELOPMENT] Using mock Firestore storage at: {_dataDir}");
    }

    private string GetUsersFile() => Path.Combine(_dataDir, "users.json");
    private string GetEvaluationsFile() => Path.Combine(_dataDir, "evaluations.json");
    private string GetShareableLinksFile() => Path.Combine(_dataDir, "shareable-links.json");

    private List<User> LoadUsers()
    {
        var file = GetUsersFile();
        if (!File.Exists(file)) return new();
        var json = File.ReadAllText(file);
        return JsonSerializer.Deserialize<List<User>>(json) ?? new();
    }

    private void SaveUsers(List<User> users)
    {
        lock (_lock)
        {
            var json = JsonSerializer.Serialize(users, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(GetUsersFile(), json);
        }
    }

    private List<EvaluationRecord> LoadEvaluations()
    {
        var file = GetEvaluationsFile();
        if (!File.Exists(file)) return new();
        var json = File.ReadAllText(file);
        return JsonSerializer.Deserialize<List<EvaluationRecord>>(json) ?? new();
    }

    private void SaveEvaluations(List<EvaluationRecord> evals)
    {
        lock (_lock)
        {
            var json = JsonSerializer.Serialize(evals, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(GetEvaluationsFile(), json);
        }
    }

    public async Task<User?> GetUserByUsernameAsync(string username)
    {
        return await Task.FromResult(LoadUsers().FirstOrDefault(u => u.Username == username));
    }

    public async Task<User?> GetUserByIdAsync(string userId)
    {
        return await Task.FromResult(LoadUsers().FirstOrDefault(u => u.Id == userId));
    }

    public async Task CreateUserAsync(User user)
    {
        var users = LoadUsers();
        user.Id = Guid.NewGuid().ToString();
        users.Add(user);
        SaveUsers(users);
        await Task.CompletedTask;
    }

    public async Task<List<EvaluationRecord>> GetEvaluationsAsync(string evaluatorId, int limit)
    {
        var evals = LoadEvaluations()
            .Where(e => e.EvaluatorId == evaluatorId)
            .OrderByDescending(e => e.DateOfEvaluation)
            .Take(limit)
            .ToList();
        return await Task.FromResult(evals);
    }

    public async Task<List<EvaluationRecord>> GetRecentEvaluationsAsync(string evaluatorId, int limit)
    {
        return await GetEvaluationsAsync(evaluatorId, limit);
    }

    public async Task AddEvaluationsAsync(List<EvaluationRecord> records)
    {
        var evals = LoadEvaluations();
        evals.AddRange(records);
        SaveEvaluations(evals);
        await Task.CompletedTask;
    }

    public async Task DeleteEvaluationsForUserAsync(string evaluatorId)
    {
        var evals = LoadEvaluations();
        evals.RemoveAll(e => e.EvaluatorId == evaluatorId);
        SaveEvaluations(evals);
        await Task.CompletedTask;
    }

    private List<ShareableEvaluationSession> LoadShareableLinks()
    {
        var file = GetShareableLinksFile();
        if (!File.Exists(file)) return new();
        var json = File.ReadAllText(file);
        return JsonSerializer.Deserialize<List<ShareableEvaluationSession>>(json) ?? new();
    }

    private void SaveShareableLinks(List<ShareableEvaluationSession> links)
    {
        lock (_lock)
        {
            var json = JsonSerializer.Serialize(links, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(GetShareableLinksFile(), json);
        }
    }

    public async Task<ShareableEvaluationSession?> CreateShareableLinkAsync(ShareableEvaluationSession session)
    {
        var links = LoadShareableLinks();
        session.LinkId = Guid.NewGuid().ToString("N").Substring(0, 12);
        links.Add(session);
        SaveShareableLinks(links);
        return await Task.FromResult(session);
    }

    public async Task<ShareableEvaluationSession?> GetShareableLinkAsync(string linkId)
    {
        var links = LoadShareableLinks();
        var session = links.FirstOrDefault(l => l.LinkId == linkId && l.IsActive);
        
        // Check if expired
        if (session != null && DateTime.UtcNow > session.ExpiresAt.ToDateTime())
        {
            session.IsActive = false;
            SaveShareableLinks(links);
            return null;
        }

        return await Task.FromResult(session);
    }
}

/// <summary>
/// Interface to abstract Firestore operations for easier testing and mocking
/// </summary>
public interface IFirestoreOperations
{
    Task<User?> GetUserByUsernameAsync(string username);
    Task<User?> GetUserByIdAsync(string userId);
    Task CreateUserAsync(User user);
    Task<List<EvaluationRecord>> GetEvaluationsAsync(string evaluatorId, int limit);
    Task<List<EvaluationRecord>> GetRecentEvaluationsAsync(string evaluatorId, int limit);
    Task AddEvaluationsAsync(List<EvaluationRecord> records);
    Task DeleteEvaluationsForUserAsync(string evaluatorId);
    Task<ShareableEvaluationSession?> CreateShareableLinkAsync(ShareableEvaluationSession session);
    Task<ShareableEvaluationSession?> GetShareableLinkAsync(string linkId);
}
