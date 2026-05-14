using Google.Cloud.Firestore;

namespace IsuBackend.DTOs;

[FirestoreData]
public class ShareableEvaluationSession
{
    [FirestoreDocumentId]
    public string LinkId { get; set; } = string.Empty;

    [FirestoreProperty("batchName")]
    public string BatchName { get; set; } = string.Empty;

    [FirestoreProperty("dateOfEvaluation")]
    public string DateOfEvaluation { get; set; } = string.Empty;

    [FirestoreProperty("designation")]
    public string Designation { get; set; } = string.Empty;

    [FirestoreProperty("department")]
    public string Department { get; set; } = string.Empty;

    [FirestoreProperty("evaluatorName")]
    public string EvaluatorName { get; set; } = string.Empty;

    [FirestoreProperty("evaluations")]
    public List<EvaluationEntry> Evaluations { get; set; } = new();

    [FirestoreProperty("createdAt")]
    public Timestamp CreatedAt { get; set; } = Timestamp.FromDateTime(DateTime.UtcNow);

    [FirestoreProperty("expiresAt")]
    public Timestamp ExpiresAt { get; set; } = Timestamp.FromDateTime(DateTime.UtcNow.AddDays(7));

    [FirestoreProperty("isActive")]
    public bool IsActive { get; set; } = true;
}
