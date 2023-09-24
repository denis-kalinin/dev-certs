Param (
    [Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string]
    $CaCertificateName,
    #= "Developer CA for Microsoft Office Add-ins",

    [Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string]
    $CaCertificatePath,
    # = "$env:userprofile\.office-addin-dev-certs\ca.crt",


    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string]
    $OutputMarker,
    # = "ddd",

    [switch]
    $ReturnInvalidCertificate
)

# An optional output marker that can be used to find the beginning of this script's output
if ($OutputMarker) {
    Write-Output $OutputMarker
}

# Without this, the script always succeeds (exit code = 0)
$ErrorActionPreference = 'Stop'

if ($PSVersionTable.PSVersion.Major -le 5) {
    # The following line is required in case pwsh is one of the parent callers
    # because the changes it makes to PSModulePath are not backward compatible with Windows powershell.
    $env:PSModulePath = [Environment]::GetEnvironmentVariable('PSModulePath', 'Machine')
}

if(Get-Command -name Import-Certificate -ErrorAction SilentlyContinue){
    $result = Get-ChildItem cert:\\CurrentUser\\Root | Where-Object Issuer -like "*CN=$CaCertificateName*"
    if (!$ReturnInvalidCertificate) {
        $result = $result | Where-Object { $_.NotAfter -gt (Get-Date).AddDays(1) }
        if ($result -and ($result.Length -eq 1) -and (Test-Path $CaCertificatePath)) {
            # Check that CA certificate in store is the same as ca.crt
            $caCert = [System.Security.Cryptography.X509Certificates.X509Certificate2]::new($CaCertificatePath)
            $caThumbprint = $caCert.Thumbprint

            $result = $result | Where-Object Thumbprint -eq $caThumbprint
        }
        else {
            $result = $null
        }
    }

    $result | Format-List
}
else{
    # Legacy system support
    Get-ChildItem cert:\\CurrentUser\\Root | Where-Object { $_.Subject -like "*CN=$CaCertificateName*"} | Where-Object { $_.NotAfter -gt (Get-Date).AddDays(1) } | Format-List
}
