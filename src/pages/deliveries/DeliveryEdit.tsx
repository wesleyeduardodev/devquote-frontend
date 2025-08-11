import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useDeliveries } from '../../hooks/useDeliveries';
import { deliveryService } from '../../services/deliveryService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import DeliveryForm from '../../components/forms/DeliveryForm.jsx';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const DeliveryEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { updateDelivery } = useDeliveries();
    const [delivery, setDelivery] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);

    useEffect(() => {
        const fetchDelivery = async () => {
            try {
                setFetchLoading(true);
                const data = await deliveryService.getById(id);
                setDelivery(data);
            } catch (error) {
                navigate('/deliveries');
            } finally {
                setFetchLoading(false);
            }
        };

        if (id) {
            fetchDelivery();
        }
    }, [id, navigate]);

    const handleSubmit = async (data) => {
        try {
            setLoading(true);
            await updateDelivery(id, data);
            navigate('/deliveries');
        } catch (error) {
            // Error handled by the hook and form
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/deliveries');
    };

    if (fetchLoading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <LoadingSpinner size="lg" />
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
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Voltar
                </Button>
            </div>

            <Card
                title="Editar Entrega"
                subtitle={`Atualize as informações da entrega`}
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