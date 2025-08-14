import React from 'react';
import {Link} from 'react-router-dom';
import {Home, ArrowLeft} from 'lucide-react';
import Button from '../components/ui/Button';

const NotFound = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                <div className="mb-8">
                    <h1 className="text-9xl font-bold text-gray-200">404</h1>
                    <h2 className="text-2xl font-bold text-gray-900 mt-4 mb-2">
                        Página não encontrada
                    </h2>
                    <p className="text-gray-600">
                        A página que você está procurando não existe ou foi movida.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                        onClick={() => window.history.back()}
                        variant="outline"
                        className="flex items-center justify-center"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2"/>
                        Voltar
                    </Button>

                    <Link to="/">
                        <Button className="flex items-center justify-center w-full">
                            <Home className="w-4 h-4 mr-2"/>
                            Ir para o Dashboard
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default NotFound;