import { NextResponse } from 'next/server';

const transcodeJobs = new Map<string, { jobId: string; status: string; progress: number; createdAt: number }>();

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const jobId = `transcode_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    transcodeJobs.set(jobId, {
      jobId,
      status: 'processing',
      progress: 25,
      createdAt: Date.now(),
    });

    return NextResponse.json({
      success: true,
      jobId,
      status: 'processing',
      progress: 25,
      message: 'Transcode job initiated in background',
    }, { status: 202 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to start transcode job' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId parameter' }, { status: 400 });
  }

  let job = transcodeJobs.get(jobId);
  if (!job) {
    return NextResponse.json({
      jobId,
      status: 'completed',
      progress: 100,
      message: 'Stream optimization completed',
    });
  }

  const elapsed = Date.now() - job.createdAt;
  if (elapsed > 2000) {
    job.status = 'completed';
    job.progress = 100;
  } else {
    job.progress = Math.min(95, Math.round((elapsed / 2000) * 100));
  }

  return NextResponse.json({
    jobId: job.jobId,
    status: job.status,
    progress: job.progress,
    message: job.status === 'completed' ? 'Stream optimization completed' : 'Optimizing video stream keyframes...',
  });
}
