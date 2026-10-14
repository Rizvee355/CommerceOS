# Windows PowerShell 5.1-compatible secret entry.
# Run in the CURRENT session using:
#   . .\scripts\Read-TokenFactoryKey.ps1
# Do not use Read-Host -MaskInput (PowerShell 7 only).
$secureKey = Read-Host 'AMD Token Factory API key' -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
try {
    $env:AMD_TOKEN_FACTORY_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    if ([string]::IsNullOrWhiteSpace($env:AMD_TOKEN_FACTORY_API_KEY)) { throw 'Empty API key' }
    Write-Host 'API key loaded into current PowerShell session (redacted).'
    Write-Host 'Do not print or log the key.'
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    $secureKey.Dispose()
}
