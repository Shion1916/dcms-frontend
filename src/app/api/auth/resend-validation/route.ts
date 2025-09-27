import { NextRequest, NextResponse } from 'next/server';
import { projectId, publicAnonKey } from '../../../../utils/supabase/info';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Get the current domain for validation link generation
    const origin = request.headers.get('origin') || 'http://localhost:3000';

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/auth/resend-validation`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email, domain: origin }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      let errorMessage = data.error || 'Failed to resend validation email';
      
      // Handle specific error cases
      if (response.status === 404) {
        errorMessage = 'No pending registration found for this email address.';
      } else if (response.status === 400 && data.error?.includes('already validated')) {
        errorMessage = 'This email has already been validated. You can now sign in.';
      } else if (response.status >= 500) {
        errorMessage = 'Server error. Please try again in a few moments.';
      }
      
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

    // For demo purposes, log the validation link
    if (data.validationLink) {
      console.log('=== EMAIL VALIDATION SERVICE (RESEND) ===');
      console.log(`To: ${email}`);
      console.log(`Subject: Validate Your Go-Goyagoy Account`);
      console.log(`Validation Link: ${data.validationLink}`);
      console.log('==========================================');
    }
    console.log(data);
    return NextResponse.json({ success: true, message: 'Validation email sent successfully' });
  } catch (error) {
    console.error('Resend validation API error:', error);
    return NextResponse.json(
      { error: 'Email validation service unavailable' },
      { status: 500 }
    );
  }
}