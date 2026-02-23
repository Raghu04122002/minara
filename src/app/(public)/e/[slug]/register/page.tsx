import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import RegisterForm from '@/components/RegisterForm';

export const dynamic = 'force-dynamic';

export default async function RegisterPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    const event = await prisma.event.findUnique({
        where: { slug },
        include: {
            tiers: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        },
    });

    if (!event) notFound();

    if (!event.registrationOpen) {
        return (
            <div style={{ maxWidth: '600px', margin: '3rem auto', padding: '0 1rem', textAlign: 'center' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Registration Closed</h1>
                <p style={{ color: '#6b7280' }}>Registration for this event is no longer available.</p>
            </div>
        );
    }

    return (
        <RegisterForm
            event={{
                id: event.id,
                title: event.title,
                slug: event.slug,
                eventType: event.eventType,
                tiers: event.tiers.map((t: any) => ({
                    id: t.id,
                    name: t.name,
                    price: Number(t.price),
                    quantity: t.quantity,
                    quantitySold: t.quantitySold,
                    description: t.description,
                })),
            }}
        />
    );
}
