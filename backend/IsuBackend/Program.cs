var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Register Firestore service - use Mock if credentials not available
var credentialsPath = builder.Configuration["GOOGLE_APPLICATION_CREDENTIALS"];
var hasCredentials = !string.IsNullOrWhiteSpace(credentialsPath) && File.Exists(credentialsPath);
var hasEnvCredentials = !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS"));

if (hasCredentials || hasEnvCredentials || File.Exists(Path.Combine(
    Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
    "gcloud", "application_default_credentials.json")))
{
    // Use real Firestore
    builder.Services.AddSingleton<IsuBackend.Services.IFirestoreOperations, IsuBackend.Services.FirestoreService>();
}
else
{
    // Use mock Firestore for development
    Console.WriteLine("⚠️  [DEVELOPMENT MODE] Using Mock Firestore (no credentials found)");
    builder.Services.AddSingleton<IsuBackend.Services.IFirestoreOperations, IsuBackend.Services.MockFirestoreService>();
}

builder.Services.AddSingleton<IsuBackend.Services.AiService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowFrontend");
app.UseAuthorization();
app.MapControllers();
app.Run();
