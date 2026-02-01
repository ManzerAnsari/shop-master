import React from 'react';
import { Icon } from '@iconify/react';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import Card from '../../components/Card/Card';
import Badge from '../../components/Badge/Badge';
import './Showcase.css';

const Showcase = () => {
  return (
    <div className="showcase-container">
      <h1 className="text-3xl font-bold text-brand-300 mb-8">Design System Showcase</h1>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6" style={{ color: '#213555' }}>Colors</h2>
        <div className="flex gap-6 flex-wrap">
          <div className="color-swatch" style={{ backgroundColor: '#213555', color: '#F5EFE7' }}>
            <span>Primary Dark</span>
            <span>#213555</span>
          </div>
          <div className="color-swatch" style={{ backgroundColor: '#3E5879', color: '#F5EFE7' }}>
            <span>Primary Medium</span>
            <span>#3E5879</span>
          </div>
          <div className="color-swatch" style={{ backgroundColor: '#D8C4B6', color: '#213555' }}>
            <span>Accent Warm</span>
            <span>#D8C4B6</span>
          </div>
          <div className="color-swatch" style={{ backgroundColor: '#F5EFE7', color: '#213555', border: '2px solid #D8C4B6' }}>
            <span>Accent Light</span>
            <span>#F5EFE7</span>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-brand-200 mb-4">Buttons</h2>
        <Card className="p-6 space-y-6">
          <div className="flex flex-wrap gap-4 items-center">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <Button disabled>Disabled</Button>
            <Button variant="primary">
              <Icon icon="mdi:cart" className="mr-2 text-xl" />
              With Icon
            </Button>
          </div>
        </Card>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-brand-200 mb-4">Inputs</h2>
        <Card className="p-6 space-y-4 max-w-md">
          <Input label="Username" placeholder="Enter your username" />
          <Input label="Email" type="email" placeholder="Enter your email" />
          <Input 
            label="Password" 
            type="password" 
            placeholder="Enter your password" 
            error="Password is required"
          />
        </Card>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-brand-200 mb-4">Badges</h2>
        <Card className="p-6">
          <div className="flex gap-4">
            <Badge variant="primary">Primary</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </Card>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-brand-200 mb-4">Icons (Iconify)</h2>
        <Card className="p-6">
          <div className="flex gap-6 text-3xl text-brand-300">
            <Icon icon="mdi:home" />
            <Icon icon="mdi:user" />
            <Icon icon="mdi:settings" />
            <Icon icon="mdi:heart" />
            <Icon icon="mdi:bell" />
          </div>
        </Card>
      </section>
    </div>
  );
};

export default Showcase;
