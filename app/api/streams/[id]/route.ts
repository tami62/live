import { type NextRequest, NextResponse } from "next/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "LiveStreams";

// Get a stream by ID
export async function GET(
  request: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { params }: any
) {
  try {
    const { id } = params;

    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { id },
    });

    const response = await docClient.send(command);

    if (!response.Item) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    return NextResponse.json({ stream: response.Item });
  } catch (error) {
    console.error("Error fetching stream:", error);
    return NextResponse.json(
      { error: "Failed to fetch stream" },
      { status: 500 }
    );
  }
}

// Update a stream
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PATCH(request: NextRequest, { params }: any) {
  try {
    const { id } = params;
    const updates = await request.json();

    // Build update expression
    let updateExpression = "set updatedAt = :updatedAt";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const expressionAttributeValues: Record<string, any> = {
      ":updatedAt": new Date().toISOString(),
    };

    // Add all update fields to the expression
    Object.keys(updates).forEach((key) => {
      if (key !== "id") {
        updateExpression += `, ${key} = :${key}`;
        expressionAttributeValues[`:${key}`] = updates[key];
      }
    });

    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
    });

    const response = await docClient.send(command);

    return NextResponse.json({ stream: response.Attributes });
  } catch (error) {
    console.error("Error updating stream:", error);
    return NextResponse.json(
      { error: "Failed to update stream" },
      { status: 500 }
    );
  }
}

// Delete a stream
export async function DELETE(
  request: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { params }: any
) {
  try {
    const { id } = params;

    const command = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { id },
    });

    await docClient.send(command);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting stream:", error);
    return NextResponse.json(
      { error: "Failed to delete stream" },
      { status: 500 }
    );
  }
}
