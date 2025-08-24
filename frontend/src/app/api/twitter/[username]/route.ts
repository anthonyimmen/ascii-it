import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    
    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const socialDataApiKey = process.env.SOCIAL_DATA_API_KEY;
    
    if (!socialDataApiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const response = await axios.get(`https://api.socialdata.tools/twitter/user/${username}`, {
      headers: { 
        'Authorization': `Bearer ${socialDataApiKey}`,
        'Accept': 'application/json'
      }
    });
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching Twitter profile:', error);
    
    if (error.response) {
      return NextResponse.json(
        { error: 'Failed to fetch profile', details: error.response.data },
        { status: error.response.status }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}