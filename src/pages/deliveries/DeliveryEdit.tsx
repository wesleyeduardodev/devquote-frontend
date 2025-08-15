import React, {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {ArrowLeft} from 'lucide-react';
import {useDeliveries} from '@/hooks/useDeliveries';
import {deliveryService} from '@/services/deliveryService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import DeliveryForm from '../../components/forms/DeliveryForm';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface DeliveryFormData {
    quoteId: number;
    projectId: number;
    status: string;
    branch?: string;
    pullRequest?: string;
    script?: string;
    startedAt?: string;
    finishedAt?: string;
    notes?: string;
}

interface Delivery extends DeliveryFormData {
    id: number;
    createdAt: string;
    updatedAt: string;
}

const DeliveryEdit: React.FC = () => {
    const {id} = useParams<{ id: string }>();
    const navigate = useNavigate();
    const {updateDelivery} = useDeliveries();
    const [delivery, setDelivery] = useState<Delivery | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [fetchLoading, setFetchLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchDelivery = async (): Promise<void> => {
            if (!id) {
                navigate('/deliveries');
                return;
            }

            try {
                setFetchLoading(true);
                const data = await deliveryService.getById(Number(id));
                setDelivery(data);
            } catch (error) {
                console.error('Error fetching delivery:', error);
                navigate('/deliveries');
            } finally {
                setFetchLoading(false);
            }
        };

        if (id) {
            fetchDelivery();
        }
    }, [id, navigate]);

    const handleSubmit = async (data: DeliveryFormData): Promise<void> => {
        if (!id) return;

        try {
            setLoading(true);
            await updateDelivery(Number(id), data);
            navigate('/deliveries');
        } catch (error) {
            // Error handled by the hook and form
            console.error('Error updating delivery:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = (): void => {
        navigate('/deliveries');
    };

    if (fetchLoading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <LoadingSpinner size="lg"/>
            </div>
        );
    }

    if (!delivery) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">Entrega não encontrada.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center space-x-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    className="flex items-center"
                >
                    <ArrowLeft className="w-4 h-4 mr-1"/>
                    Voltar
                </Button>
            </div>

            <Card
                title={
                    <div className="flex items-center gap-2">
                        <span>Editar Entrega</span>
                        <span
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                            #{delivery.id}
                        </span>
                    </div>
                }
                subtitle="Atualize as informações da entrega"
            >
                <DeliveryForm
                    initialData={delivery}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    loading={loading}
                />
            </Card>
        </div>
    );
};

export default DeliveryEdit;
