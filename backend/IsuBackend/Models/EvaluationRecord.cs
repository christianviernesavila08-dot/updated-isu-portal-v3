using Google.Cloud.Firestore;

namespace IsuBackend.Models;

[FirestoreData]
public class EvaluationRecord
{
    [FirestoreDocumentId]
    public string Id { get; set; } = string.Empty;

    [FirestoreProperty("batchId")]
    public string BatchId { get; set; } = string.Empty;

    [FirestoreProperty("batchName")]
    public string BatchName { get; set; } = string.Empty;

    [FirestoreProperty("supplierName")]
    public string SupplierName { get; set; } = string.Empty;

    [FirestoreProperty("purchaseOrderNo")]
    public string PurchaseOrderNo { get; set; } = string.Empty;

    [FirestoreProperty("address")]
    public string Address { get; set; } = string.Empty;

    [FirestoreProperty("ratings")]
    public Ratings Ratings { get; set; } = new Ratings();

    [FirestoreProperty("comments")]
    public string Comments { get; set; } = string.Empty;

    [FirestoreProperty("dateOfEvaluation")]
    public string DateOfEvaluation { get; set; } = string.Empty;

    [FirestoreProperty("designation")]
    public string Designation { get; set; } = string.Empty;

    [FirestoreProperty("department")]
    public string Department { get; set; } = string.Empty;

    [FirestoreProperty("evaluatorId")]
    public string EvaluatorId { get; set; } = string.Empty;

    [FirestoreProperty("evaluatorName")]
    public string EvaluatorName { get; set; } = string.Empty;

    [FirestoreProperty("createdAt")]
    public Timestamp CreatedAt { get; set; } = Timestamp.FromDateTime(DateTime.UtcNow);

    [FirestoreProperty("averageScore")]
    public double AverageScore { get; set; }

    [FirestoreProperty("ratingCategory")]
    public string RatingCategory { get; set; } = string.Empty;
}

[FirestoreData]
public class Ratings
{
    [FirestoreProperty("quality")]
    public double Quality { get; set; }

    [FirestoreProperty("price")]
    public double Price { get; set; }

    [FirestoreProperty("delivery")]
    public double Delivery { get; set; }

    [FirestoreProperty("completeness")]
    public double Completeness { get; set; }

    [FirestoreProperty("afterSales")]
    public double AfterSales { get; set; }
}
