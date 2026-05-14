using IsuBackend.Models;

namespace IsuBackend.DTOs;

public class EvaluationEntry
{
    public string SupplierName { get; set; } = string.Empty;
    public string PurchaseOrderNo { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public Ratings Ratings { get; set; } = new Ratings();
    public string Comments { get; set; } = string.Empty;
}

public class EvaluationBatchRequest
{
    public string BatchId { get; set; } = string.Empty;
    public string BatchName { get; set; } = string.Empty;
    public string DateOfEvaluation { get; set; } = string.Empty;
    public string Designation { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string EvaluatorId { get; set; } = string.Empty;
    public string EvaluatorName { get; set; } = string.Empty;
    public List<EvaluationEntry> Evaluations { get; set; } = new();
}

public class UserStatsResponse
{
    public int TotalEvaluations { get; set; }
    public int EvaluationsToday { get; set; }
    public double AverageScore { get; set; }
    public List<EvaluationRecord> RecentRecords { get; set; } = new();
}

public class EvaluationSummaryResponse
{
    public string Summary { get; set; } = string.Empty;
}

public class CreateShareableLinkRequest
{
    public string BatchName { get; set; } = string.Empty;
    public string DateOfEvaluation { get; set; } = string.Empty;
    public string Designation { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string EvaluatorName { get; set; } = string.Empty;
    public List<EvaluationEntry> Evaluations { get; set; } = new();
}

public class ShareableLinkResponse
{
    public string LinkId { get; set; } = string.Empty;
    public string ShareUrl { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
}

public class ShareableEvaluationSessionRequest
{
    public string LinkId { get; set; } = string.Empty;
}

public class ShareableEvaluationSessionResponse
{
    public string BatchName { get; set; } = string.Empty;
    public string DateOfEvaluation { get; set; } = string.Empty;
    public string Designation { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string EvaluatorName { get; set; } = string.Empty;
    public List<EvaluationEntry> Evaluations { get; set; } = new();
}
