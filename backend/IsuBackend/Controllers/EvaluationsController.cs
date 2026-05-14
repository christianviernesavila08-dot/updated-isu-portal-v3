using IsuBackend.DTOs;
using IsuBackend.Models;
using IsuBackend.Services;
using Microsoft.AspNetCore.Mvc;

namespace IsuBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EvaluationsController : ControllerBase
{
    private readonly IFirestoreOperations _firestore;

    public EvaluationsController(IFirestoreOperations firestore)
    {
        _firestore = firestore;
    }

    [HttpPost("batch")]
    public async Task<IActionResult> CreateBatch([FromBody] EvaluationBatchRequest request)
    {
        if (request.Evaluations.Count == 0)
        {
            return BadRequest("At least one evaluation entry is required.");
        }

        var records = request.Evaluations.Select(entry => new EvaluationRecord
        {
            BatchId = string.IsNullOrWhiteSpace(request.BatchId) ? Guid.NewGuid().ToString("N") : request.BatchId,
            BatchName = request.BatchName,
            SupplierName = entry.SupplierName,
            PurchaseOrderNo = entry.PurchaseOrderNo,
            Address = entry.Address,
            Ratings = entry.Ratings,
            Comments = entry.Comments,
            DateOfEvaluation = request.DateOfEvaluation,
            Designation = request.Designation,
            Department = request.Department,
            EvaluatorId = request.EvaluatorId,
            EvaluatorName = request.EvaluatorName,
            AverageScore = CalculateAverage(entry.Ratings),
            RatingCategory = GetCategoryFromScore(CalculateAverage(entry.Ratings))
        }).ToList();

        await _firestore.AddEvaluationsAsync(records);
        return Ok(new { records = records.Count });
    }

    [HttpGet("recent")]
    public async Task<IActionResult> GetRecent([FromQuery] string evaluatorId)
    {
        if (string.IsNullOrWhiteSpace(evaluatorId))
        {
            return BadRequest("EvaluatorId is required.");
        }

        var recent = await _firestore.GetRecentEvaluationsAsync(evaluatorId, 5);
        return Ok(recent);
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats([FromQuery] string evaluatorId)
    {
        if (string.IsNullOrWhiteSpace(evaluatorId))
        {
            return BadRequest("EvaluatorId is required.");
        }

        var records = await _firestore.GetEvaluationsAsync(evaluatorId, 1000);
        var todayString = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var total = records.Count;
        var average = total > 0 ? records.Average(r => r.AverageScore) : 0.0;
        var today = records.Count(r => r.DateOfEvaluation == todayString);

        return Ok(new UserStatsResponse
        {
            TotalEvaluations = total,
            AverageScore = Math.Round(average, 2),
            EvaluationsToday = today,
            RecentRecords = records.OrderByDescending(r => r.CreatedAt.ToDateTime()).Take(5).ToList()
        });
    }

    [HttpGet("all")]
    public async Task<IActionResult> GetAll([FromQuery] string evaluatorId)
    {
        if (string.IsNullOrWhiteSpace(evaluatorId))
        {
            return BadRequest("EvaluatorId is required.");
        }

        var records = await _firestore.GetEvaluationsAsync(evaluatorId, 1000);
        return Ok(records);
    }

    [HttpDelete("reset")]
    public async Task<IActionResult> Reset([FromQuery] string evaluatorId)
    {
        if (string.IsNullOrWhiteSpace(evaluatorId))
        {
            return BadRequest("EvaluatorId is required.");
        }

        await _firestore.DeleteEvaluationsForUserAsync(evaluatorId);
        return Ok(new { deleted = true });
    }

    [HttpPost("create-shareable-link")]
    public async Task<IActionResult> CreateShareableLink([FromBody] CreateShareableLinkRequest request)
    {
        if (request.Evaluations.Count == 0)
        {
            return BadRequest("At least one evaluation entry is required.");
        }

        var session = new ShareableEvaluationSession
        {
            BatchName = request.BatchName,
            DateOfEvaluation = request.DateOfEvaluation,
            Designation = request.Designation,
            Department = request.Department,
            EvaluatorName = request.EvaluatorName,
            Evaluations = request.Evaluations,
            IsActive = true
        };

        var createdSession = await _firestore.CreateShareableLinkAsync(session);
        if (createdSession == null)
        {
            return StatusCode(500, "Failed to create shareable link");
        }

        var baseUrl = $"{Request.Scheme}://{Request.Host}";
        var shareUrl = $"{baseUrl}/?shareId={createdSession.LinkId}";

        return Ok(new ShareableLinkResponse
        {
            LinkId = createdSession.LinkId,
            ShareUrl = shareUrl,
            CreatedAt = createdSession.CreatedAt.ToDateTime(),
            ExpiresAt = createdSession.ExpiresAt.ToDateTime()
        });
    }

    [HttpGet("shareable-link")]
    public async Task<IActionResult> GetShareableLink([FromQuery] string linkId)
    {
        if (string.IsNullOrWhiteSpace(linkId))
        {
            return BadRequest("Link ID is required.");
        }

        var session = await _firestore.GetShareableLinkAsync(linkId);
        if (session == null)
        {
            return NotFound("Link not found or has expired.");
        }

        return Ok(new ShareableEvaluationSessionResponse
        {
            BatchName = session.BatchName,
            DateOfEvaluation = session.DateOfEvaluation,
            Designation = session.Designation,
            Department = session.Department,
            EvaluatorName = session.EvaluatorName,
            Evaluations = session.Evaluations
        });
    }

    private static double CalculateAverage(Ratings ratings)
    {
        var values = new[] { ratings.Quality, ratings.Price, ratings.Delivery, ratings.Completeness, ratings.AfterSales };
        return values.Average();
    }

    private static string GetCategoryFromScore(double score)
    {
        if (score >= 4.5) return "Excellent";
        if (score >= 3.5) return "Very Satisfactory";
        if (score >= 2.5) return "Satisfactory";
        if (score >= 1.5) return "Fair";
        return "Poor";
    }
}
