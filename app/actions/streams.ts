"use server"

import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb"
import { v4 as uuidv4 } from "uuid"
import { revalidatePath } from "next/cache"

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID || "",
    secretAccessKey: process.env.SECRET_ACCESS_KEY || "",
  },
})

const docClient = DynamoDBDocumentClient.from(client)
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "LiveStreams"

export interface StreamData {
  id?: string
  title: string
  description?: string
  streamerName: string
  streamId: string
  thumbnail?: string
  isActive: boolean
  viewerCount?: number
  startedAt?: string
  createdAt?: string
  updatedAt?: string
}

// Get all active streams
export async function getActiveStreams() {
  try {
    const command = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "isActive = :isActive",
      ExpressionAttributeValues: {
        ":isActive": true,
      },
    })

    const response = await docClient.send(command)
    return response.Items as StreamData[]
  } catch (error) {
    console.error("Error fetching streams:", error)
    throw new Error("Failed to fetch streams")
  }
}

// Get a stream by ID
export async function getStreamById(id: string) {
  try {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { id },
    })

    const response = await docClient.send(command)
    return response.Item as StreamData
  } catch (error) {
    console.error("Error fetching stream:", error)
    throw new Error("Failed to fetch stream")
  }
}

// Get a stream by streamId
export async function getStreamByStreamId(streamId: string) {
  try {
    // Since this is not a primary key, we need to scan with a filter
    const command = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "streamId = :streamId",
      ExpressionAttributeValues: {
        ":streamId": streamId,
      },
    })

    const response = await docClient.send(command)

    if (!response.Items || response.Items.length === 0) {
      return null
    }

    return response.Items[0] as StreamData
  } catch (error) {
    console.error("Error fetching stream by streamId:", error)
    throw new Error("Failed to fetch stream by streamId")
  }
}

// Create a new stream
export async function createStream(streamData: StreamData) {
  try {
    const id = uuidv4()
    const timestamp = new Date().toISOString()

    const newStream = {
      id,
      ...streamData,
      viewerCount: streamData.viewerCount || 0,
      startedAt: streamData.startedAt || timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: newStream,
    })

    await docClient.send(command)
    revalidatePath("/viewer")

    return newStream
  } catch (error) {
    console.error("Error creating stream:", error)
    throw new Error("Failed to create stream")
  }
}

// Update a stream
export async function updateStream(id: string, updates: Partial<StreamData>) {
  try {
    // Build update expression
    let updateExpression = "set updatedAt = :updatedAt"
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const expressionAttributeValues: Record<string, any> = {
      ":updatedAt": new Date().toISOString(),
    }

    // Add all update fields to the expression
    Object.keys(updates).forEach((key) => {
      if (key !== "id" && key !== "createdAt") {
        updateExpression += `, ${key} = :${key}`
        expressionAttributeValues[`:${key}`] = updates[key as keyof typeof updates]
      }
    })

    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
    })

    const response = await docClient.send(command)
    revalidatePath("/viewer")

    return response.Attributes as StreamData
  } catch (error) {
    console.error("Error updating stream:", error)
    throw new Error("Failed to update stream")
  }
}

// Update viewer count
export async function updateViewerCount(id: string, viewerCount: number) {
  try {
    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression: "set viewerCount = :viewerCount, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":viewerCount": viewerCount,
        ":updatedAt": new Date().toISOString(),
      },
      ReturnValues: "ALL_NEW",
    })

    const response = await docClient.send(command)
    revalidatePath("/viewer")

    return response.Attributes as StreamData
  } catch (error) {
    console.error("Error updating viewer count:", error)
    throw new Error("Failed to update viewer count")
  }
}

// End a stream (mark as inactive)
export async function endStream(id: string) {
  try {
    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression: "set isActive = :isActive, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":isActive": false,
        ":updatedAt": new Date().toISOString(),
      },
      ReturnValues: "ALL_NEW",
    })

    const response = await docClient.send(command)
    revalidatePath("/viewer")

    return response.Attributes as StreamData
  } catch (error) {
    console.error("Error ending stream:", error)
    throw new Error("Failed to end stream")
  }
}

// Update thumbnail
export async function updateThumbnail(id: string, thumbnail: string) {
  try {
    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression: "set thumbnail = :thumbnail, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":thumbnail": thumbnail,
        ":updatedAt": new Date().toISOString(),
      },
      ReturnValues: "ALL_NEW",
    })

    const response = await docClient.send(command)
    revalidatePath("/viewer")

    return response.Attributes as StreamData
  } catch (error) {
    console.error("Error updating thumbnail:", error)
    throw new Error("Failed to update thumbnail")
  }
}
