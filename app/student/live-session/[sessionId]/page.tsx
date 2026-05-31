import StudentLiveSession from '../../../../screens/StudentLiveSession';

export default async function StudentLiveSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <StudentLiveSession sessionId={sessionId} />;
}
