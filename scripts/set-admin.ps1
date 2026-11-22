param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern("^[^\s@]+@[^\s@]+\.[^\s@]+$")]
  [string]$Email,

  [ValidateSet("admin", "student")]
  [string]$Role = "admin",

  [switch]$Remote
)

$escapedEmail = $Email.Replace("'", "''")
$escapedRole = $Role.Replace("'", "''")

$updateSql = "update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', '$escapedRole') where email = '$escapedEmail';"

$remoteArgs = @()
if ($Remote) {
  $remoteArgs = @("--remote")
}

Write-Host "Assigning trusted role '$Role' to '$Email'..."
& npx supabase db query @remoteArgs $updateSql
if ($LASTEXITCODE -ne 0) {
  throw "Supabase role update failed."
}

$verifySql = "select email, raw_app_meta_data ->> 'role' as role from auth.users where email = '$escapedEmail';"
Write-Host "Verifying trusted role claim..."
& npx supabase db query @remoteArgs $verifySql
if ($LASTEXITCODE -ne 0) {
  throw "Supabase role verification failed."
}

Write-Host "The user must sign out and sign in again so a fresh JWT contains the updated app_metadata role."
