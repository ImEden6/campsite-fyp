/**
 * VehicleInput Component
 * Allows users to add and manage vehicle information
 */

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { type Vehicle, VehicleType } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';

interface VehicleInputProps {
  vehicles: Omit<Vehicle, 'id'>[];
  onChange: (vehicles: Omit<Vehicle, 'id'>[]) => void;
  maxVehicles: number;
}

const emptyVehicle: Omit<Vehicle, 'id'> = {
  make: '',
  model: '',
  year: new Date().getFullYear(),
  licensePlate: '',
  state: '',
  color: '',
  type: VehicleType.CAR,
};

export const VehicleInput: React.FC<VehicleInputProps> = ({
  vehicles,
  onChange,
  maxVehicles,
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(
    vehicles.length === 0 ? 0 : null
  );

  const handleAdd = () => {
    if (vehicles.length < maxVehicles) {
      onChange([...vehicles, { ...emptyVehicle }]);
      setEditingIndex(vehicles.length);
    }
  };

  const handleRemove = (index: number) => {
    const newVehicles = vehicles.filter((_, i) => i !== index);
    onChange(newVehicles);
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const handleUpdate = (index: number, field: keyof Omit<Vehicle, 'id'>, value: string | number) => {
    const newVehicles = [...vehicles];
    newVehicles[index] = { ...newVehicles[index]!, [field]: value };
    onChange(newVehicles);
  };

  const handleSave = () => {
    setEditingIndex(null);
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
  };

  return (
    <div className="space-y-4">
      {vehicles.map((vehicle, index) => (
        <Card key={index} className="p-4">
          {editingIndex === index ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Make *
                  </label>
                  <Input
                    type="text"
                    value={vehicle.make}
                    onChange={(e) => handleUpdate(index, 'make', e.target.value)}
                    placeholder="Toyota"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model *
                  </label>
                  <Input
                    type="text"
                    value={vehicle.model}
                    onChange={(e) => handleUpdate(index, 'model', e.target.value)}
                    placeholder="Camry"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year *
                  </label>
                  <Input
                    type="number"
                    value={vehicle.year}
                    onChange={(e) => handleUpdate(index, 'year', parseInt(e.target.value))}
                    min="1900"
                    max={new Date().getFullYear() + 1}
                  />
                </div>

                <div>
                  <Select
                    label="Type *"
                    value={vehicle.type}
                    onChange={(value) => handleUpdate(index, 'type', value)}
                    options={[
                      { value: VehicleType.CAR, label: 'Car' },
                      { value: VehicleType.TRUCK, label: 'Truck' },
                      { value: VehicleType.RV, label: 'RV' },
                      { value: VehicleType.MOTORCYCLE, label: 'Motorcycle' },
                      { value: VehicleType.TRAILER, label: 'Trailer' },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    License Plate *
                  </label>
                  <Input
                    type="text"
                    value={vehicle.licensePlate}
                    onChange={(e) => handleUpdate(index, 'licensePlate', e.target.value.toUpperCase())}
                    placeholder="ABC1234"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State *
                  </label>
                  <Input
                    type="text"
                    value={vehicle.state}
                    onChange={(e) => handleUpdate(index, 'state', e.target.value.toUpperCase())}
                    placeholder="CA"
                    maxLength={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color *
                  </label>
                  <Input
                    type="text"
                    value={vehicle.color}
                    onChange={(e) => handleUpdate(index, 'color', e.target.value)}
                    placeholder="Blue"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => handleRemove(index)}>
                  <Trash2 size={16} />
                  Remove
                </Button>
                <Button variant="primary" size="sm" onClick={handleSave}>
                  Save Vehicle
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </p>
                <p className="text-sm text-gray-600">
                  {vehicle.licensePlate} ({vehicle.state}) • {vehicle.type} • {vehicle.color}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(index)}>
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleRemove(index)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          )}
        </Card>
      ))}

      {vehicles.length < maxVehicles && editingIndex === null && (
        <Button variant="outline" onClick={handleAdd} className="w-full">
          <Plus size={16} />
          Add Vehicle
        </Button>
      )}

      {vehicles.length === 0 && editingIndex === null && (
        <div className="text-center py-8 text-gray-500">
          <p>No vehicles added yet</p>
          <Button variant="primary" onClick={handleAdd} className="mt-4">
            <Plus size={16} />
            Add Your First Vehicle
          </Button>
        </div>
      )}
    </div>
  );
};
