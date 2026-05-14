using Google.Cloud.Firestore;
using IsuBackend.Models;
using IsuBackend.DTOs;

namespace IsuBackend.Services;

public class FirestoreService : IFirestoreOperations
{
    private readonly FirestoreDb _db;

    public FirestoreService(IConfiguration configuration)
    {
        var projectId = configuration["FIRESTORE_PROJECT_ID"];
        var databaseId = configuration["FIRESTORE_DATABASE_ID"];
        var credentialsPath = configuration["GOOGLE_APPLICATION_CREDENTIALS"];

        if (string.IsNullOrWhiteSpace(projectId))
        {
            throw new InvalidOperationException("FIRESTORE_PROJECT_ID must be configured.");
        }

        // Set environment variable if path is provided in config
        if (!string.IsNullOrWhiteSpace(credentialsPath))
        {
            Environment.SetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS", credentialsPath);
        }

        try
        {
            _db = string.IsNullOrWhiteSpace(databaseId)
                ? FirestoreDb.Create(projectId)
                : new FirestoreDbBuilder
                {
                    ProjectId = projectId,
                    DatabaseId = databaseId
                }.Build();
        }
        catch (Exception ex) when (ex.Message.Contains("default credentials") || ex.InnerException?.Message?.Contains("default credentials") == true)
        {
            throw new InvalidOperationException(
                $"Google Cloud credentials not found. Please set up credentials:\n" +
                $"1. Download service account JSON from Google Cloud Console\n" +
                $"2. Set GOOGLE_APPLICATION_CREDENTIALS path in appsettings or environment\n" +
                $"Project ID: {projectId}", ex);
        }
    }

    public async Task<User?> GetUserByUsernameAsync(string username)
    {
        var users = _db.Collection("users");
        var query = users.WhereEqualTo("username", username.ToLowerInvariant()).Limit(1);
        var snapshot = await query.GetSnapshotAsync();
        if (snapshot.Count == 0) return null;
        return snapshot.Documents[0].ConvertTo<User>();
    }

    public async Task<User?> GetUserByIdAsync(string userId)
    {
        var doc = await _db.Collection("users").Document(userId).GetSnapshotAsync();
        if (!doc.Exists) return null;
        return doc.ConvertTo<User>();
    }

    public async Task CreateUserAsync(User user)
    {
        user.Username = user.Username.ToLowerInvariant();
        user.CreatedAt = Timestamp.FromDateTime(DateTime.UtcNow);
        var docRef = await _db.Collection("users").AddAsync(user);
        user.Id = docRef.Id;
    }

    public async Task AddEvaluationsAsync(List<EvaluationRecord> records)
    {
        var batch = _db.StartBatch();
        foreach (var record in records)
        {
            record.CreatedAt = Timestamp.FromDateTime(DateTime.UtcNow);
            var docRef = _db.Collection("evaluations").Document();
            batch.Set(docRef, record);
        }
        await batch.CommitAsync();
    }

    public async Task<List<EvaluationRecord>> GetRecentEvaluationsAsync(string evaluatorId, int limit = 5)
    {
        var query = _db.Collection("evaluations")
            .WhereEqualTo("evaluatorId", evaluatorId)
            .OrderByDescending("createdAt")
            .Limit(limit);

        var snapshot = await query.GetSnapshotAsync();
        return snapshot.Documents.Select(d => d.ConvertTo<EvaluationRecord>()).ToList();
    }

    public async Task<List<EvaluationRecord>> GetEvaluationsAsync(string evaluatorId, int limit = 100)
    {
        var query = _db.Collection("evaluations")
            .WhereEqualTo("evaluatorId", evaluatorId)
            .OrderByDescending("createdAt")
            .Limit(limit);

        var snapshot = await query.GetSnapshotAsync();
        return snapshot.Documents.Select(d => d.ConvertTo<EvaluationRecord>()).ToList();
    }

    public async Task DeleteEvaluationsForUserAsync(string evaluatorId)
    {
        var query = _db.Collection("evaluations").WhereEqualTo("evaluatorId", evaluatorId);
        var snapshot = await query.GetSnapshotAsync();
        var batch = _db.StartBatch();
        foreach (var doc in snapshot.Documents)
        {
            batch.Delete(doc.Reference);
        }
        await batch.CommitAsync();
    }

    public async Task<ShareableEvaluationSession?> CreateShareableLinkAsync(ShareableEvaluationSession session)
    {
        session.LinkId = Guid.NewGuid().ToString("N").Substring(0, 12);
        session.CreatedAt = Timestamp.FromDateTime(DateTime.UtcNow);
        session.ExpiresAt = Timestamp.FromDateTime(DateTime.UtcNow.AddDays(7)); // Link expires in 7 days
        
        var docRef = _db.Collection("shareable-evaluation-sessions").Document(session.LinkId);
        await docRef.SetAsync(session);
        
        return session;
    }

    public async Task<ShareableEvaluationSession?> GetShareableLinkAsync(string linkId)
    {
        var doc = await _db.Collection("shareable-evaluation-sessions").Document(linkId).GetSnapshotAsync();
        if (!doc.Exists) return null;

        var session = doc.ConvertTo<ShareableEvaluationSession>();
        
        // Check if expired
        if (DateTime.UtcNow > session.ExpiresAt.ToDateTime())
        {
            session.IsActive = false;
            await doc.Reference.UpdateAsync(new Dictionary<string, object> { { "isActive", false } });
            return null;
        }

        return session;
    }
}
