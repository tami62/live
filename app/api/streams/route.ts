import { type NextRequest, NextResponse } from "next/server"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, ScanCommand, PutCommand } from "@aws-sdk/lib-dynamodb"

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
})

const docClient = DynamoDBDocumentClient.from(client)
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "LiveStreams"

// Get all active streams
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isActiveOnly = searchParams.get("active") === "true"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any = {
      TableName: TABLE_NAME,
    }

    if (isActiveOnly) {
      // If we need only active streams, use FilterExpression
      params.FilterExpression = "isActive = :isActive"
      params.ExpressionAttributeValues = {
        ":isActive": true,
      }
    }

    const command = new ScanCommand(params)
    const response = await docClient.send(command)

    return NextResponse.json({ streams: response.Items || [] })
  } catch (error) {
    console.error("Error fetching streams:", error)
    return NextResponse.json({ error: "Failed to fetch streams" }, { status: 500 })
  }
}

// Create a new stream
export async function POST(request: NextRequest) {
  try {
    const stream = await request.json()

    // Add required attributes
    stream.id = stream.id || `stream-${Date.now()}`
    stream.createdAt = new Date().toISOString()
    stream.updatedAt = new Date().toISOString()

    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: stream,
    })

    await docClient.send(command)

    return NextResponse.json({ stream })
  } catch (error) {
    console.error("Error creating stream:", error)
    return NextResponse.json({ error: "Failed to create stream" }, { status: 500 })
  }
}
