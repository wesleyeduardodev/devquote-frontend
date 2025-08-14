import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {ArrowLeft} from 'lucide-react';
import {useDeliveries} from '@/hooks/useDeliveries';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import DeliveryForm from '../../components/forms/DeliveryForm';

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

const DeliveryCreate: React.FC = () => {
    const navigate = useNavigate();
    const {createDelivery} = useDeliveries();
    const [loading, setLoading] = useState<boolean>(false);

    const handleSubmit = async (data: DeliveryFormData): Promise<void> => {
        try {
            setLoading(true);
            await createDelivery(data);
            navigate('/deliveries');
        } catch (error) {
            console.error('Error creating delivery:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = (): void => {
        navigate('/deliveries');
    };

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
                title="Nova Entrega"
                subtitle="Preencha as informações para criar uma nova entrega de projeto"
            >
                <DeliveryForm
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    loading={loading}
                />
            </Card>
        </div>
    );
};

export default DeliveryCreate;