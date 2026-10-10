$base = "http://localhost:5000/api"

$email = Read-Host "Email"
$secure = Read-Host "Password" -AsSecureString
$password = [System.Net.NetworkCredential]::new("", $secure).Password

try {
  $login = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType "application/json" -Body (@{ email = $email; password = $password } | ConvertTo-Json)
} catch {
  Write-Host "Login failed. Is the backend running, and are the credentials right?" -ForegroundColor Red
  exit 1
}
$headers = @{ Authorization = "Bearer $($login.token)" }

$before = @(Invoke-RestMethod -Uri "$base/trips" -Headers $headers)
if ($before.Count -eq 0) {
  Write-Host "You have no saved trips. Save one in the Trip Planner first." -ForegroundColor Yellow
  exit 1
}

$trip = $before[0]
$id = $trip._id
$originalName = $trip.name
Write-Host "Newest trip: '$originalName' | startDate=$($trip.startDate) endDate=$($trip.endDate) travelers=$($trip.travelers)"

try {
  # Attempt to reassign the trip to another user AND rename it.
  Invoke-RestMethod -Uri "$base/trips/$id" -Method PUT -ContentType "application/json" -Headers $headers -Body (@{ user = "000000000000000000000000"; name = "Renamed by test" } | ConvertTo-Json) | Out-Null

  $after = @(Invoke-RestMethod -Uri "$base/trips" -Headers $headers)
  $updated = $after | Where-Object { $_._id -eq $id }

  Write-Host "Trips before: $($before.Count), after: $($after.Count)"
  if ($after.Count -eq $before.Count -and $updated -and $updated.name -eq "Renamed by test") {
    Write-Host "PASS: the name changed, but the owner could not be changed." -ForegroundColor Green
  } else {
    Write-Host "FAIL: the trip left your account or the update misbehaved." -ForegroundColor Red
  }
} finally {
  try {
    Invoke-RestMethod -Uri "$base/trips/$id" -Method PUT -ContentType "application/json" -Headers $headers -Body (@{ name = $originalName } | ConvertTo-Json) | Out-Null
    Write-Host "Original name restored."
  } catch {
    Write-Host "Couldn't restore the original name automatically." -ForegroundColor Yellow
  }
}