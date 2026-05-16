' VBScript to start detached services
Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

repoRoot = "c:\Users\kkagiri\Sources\Repo\TenacityFMS"

' Service 1: FMS.WebClient
Set objProc1 = objShell.Exec("cmd.exe /c cd /d """ & repoRoot & """ && dotnet run --project apps/FMS.WebClient/FMS.WebClient.csproj")
WScript.Echo "Started FMS.WebClient - PID: " & objProc1.ProcessID

' Service 2: FMS.Sales.Api
Set objProc2 = objShell.Exec("cmd.exe /c cd /d """ & repoRoot & """ && dotnet run --project FMS.Sales/FMS.Sales.Api/FMS.Sales.Api.csproj")
WScript.Echo "Started FMS.Sales.Api - PID: " & objProc2.ProcessID

' Service 3: FMS.Admin - First check node_modules, then npm run dev
adminDir = repoRoot & "\apps\FMS.Admin"
If Not objFSO.FolderExists(adminDir & "\node_modules") Then
    WScript.Echo "Installing npm dependencies for FMS.Admin..."
    Set objProc3 = objShell.Exec("cmd.exe /c cd /d """ & adminDir & """ && npm install")
    objProc3.Status
End If

Set objProc3 = objShell.Exec("cmd.exe /c cd /d """ & adminDir & """ && npm run dev")
WScript.Echo "Started FMS.Admin - PID: " & objProc3.ProcessID
