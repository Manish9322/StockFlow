"use client"

import { useAuth } from "@/lib/auth-context"
import { useEffect, useState } from "react"

export default function AuthDebugPage() {
  const { user, token } = useAuth()
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testAuthenticatedRequest = async () => {
    setLoading(true)
    setTestResult(null)

    try {
      // Test with token
      const response = await fetch("/api/product", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      setTestResult({
        status: response.status,
        statusText: response.statusText,
        data: data,
      })
    } catch (error: any) {
      setTestResult({
        error: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: "20px", fontFamily: "monospace" }}>
      <h1>Authentication Debug Page</h1>
      
      <div style={{ background: "#f0f0f0", padding: "15px", margin: "10px 0", borderRadius: "5px" }}>
        <h2>Auth Context State:</h2>
        <pre>{JSON.stringify({ user, token: token ? `${token.substring(0, 20)}...` : null }, null, 2)}</pre>
      </div>

      <div style={{ background: "#f0f0f0", padding: "15px", margin: "10px 0", borderRadius: "5px" }}>
        <h2>LocalStorage:</h2>
        <pre>
          {typeof window !== "undefined" ? JSON.stringify({
            user: localStorage.getItem("user"),
            token: localStorage.getItem("token") ? `${localStorage.getItem("token")?.substring(0, 20)}...` : null,
          }, null, 2) : "Not available on server"}
        </pre>
      </div>

      <button 
        onClick={testAuthenticatedRequest}
        disabled={loading || !token}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          cursor: loading || !token ? "not-allowed" : "pointer",
          background: loading || !token ? "#ccc" : "#007bff",
          color: "white",
          border: "none",
          borderRadius: "5px",
          marginTop: "10px",
        }}
      >
        {loading ? "Testing..." : "Test Authenticated API Call"}
      </button>

      {testResult && (
        <div style={{ 
          background: testResult.error ? "#ffe0e0" : "#e0ffe0", 
          padding: "15px", 
          margin: "10px 0", 
          borderRadius: "5px" 
        }}>
          <h2>Test Result:</h2>
          <pre>{JSON.stringify(testResult, null, 2)}</pre>
        </div>
      )}

      <div style={{ background: "#fff3cd", padding: "15px", margin: "20px 0", borderRadius: "5px" }}>
        <h3>Instructions:</h3>
        <ol>
          <li>Make sure you're logged in</li>
          <li>Check that user and token are shown above</li>
          <li>Click "Test Authenticated API Call"</li>
          <li>If you get 401, the token is not being sent correctly</li>
          <li>If you get 200, authentication is working</li>
        </ol>
      </div>
    </div>
  )
}
