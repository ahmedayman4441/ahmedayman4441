Set WshShell = CreateObject("WScript.Shell")
Set objShell = CreateObject("WScript.Shell")
projectPath = WshShell.CurrentDirectory
If projectPath = "" Then
    projectPath = Replace(WScript.ScriptFullName, WScript.ScriptName, "")
End If

cmdPath = projectPath & "run_hidden.bat"
objShell.Run """" & cmdPath & """", 0, False
