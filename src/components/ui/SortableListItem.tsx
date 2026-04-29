import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface SortableListItemRenderProps {
    attributes: ReturnType<typeof useSortable>['attributes'];
    listeners: ReturnType<typeof useSortable>['listeners'];
    isDragging: boolean;
}

interface SortableListItemProps {
    id: string;
    children: (handle: SortableListItemRenderProps) => React.ReactNode;
}

const SortableListItem: React.FC<SortableListItemProps> = ({ id, children }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : undefined,
    };
    return (
        <div ref={setNodeRef} style={style}>
            {children({ attributes, listeners, isDragging })}
        </div>
    );
};

export default SortableListItem;
