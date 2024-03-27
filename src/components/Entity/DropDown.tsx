import React from 'react';
import { Button, Dropdown, DropdownList, DropdownListItem } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

interface DropDownProps {
  onSelect: (type: 'entity' | 'string' | 'number' | 'decimal') => void;
  onToggle?: (open: boolean) => void;
  options?: string;
}

const DropDown = ({ onSelect = () => {}, onToggle = () => {}, options }: DropDownProps) => {
  const [isOpen, setOpen] = React.useState(false);
  let dropDownOptions: Record<string, boolean> = {
    entity: false,
    default: false,
    decimal: false,
    number: false,
  };
  options?.split('|').forEach((option) => (dropDownOptions[option] = true));
  return (
    <Dropdown
      isOpen={isOpen}
      toggleElement={
        <Button
          size="small"
          buttonType="naked"
          onClick={() => {
            onToggle(!isOpen);
            setOpen(!isOpen);
          }}
          icon="PlusCircle"
          style={{ marginTop: tokens.spacingS }}
        >
          Add Item
        </Button>
      }
    >
      <DropdownList>
        {dropDownOptions.entity ? (
          <DropdownListItem
            onClick={() => {
              onSelect('entity');
              onToggle(false);
              setOpen(() => false);
            }}
          >
            Entity
          </DropdownListItem>
        ) : null}
        {dropDownOptions.default ? (
          <DropdownListItem
            onClick={() => {
              onSelect('string');
              onToggle(false);
              setOpen(() => false);
            }}
          >
            Default
          </DropdownListItem>
        ) : null}
        {dropDownOptions.number ? (
          <DropdownListItem
            onClick={() => {
              onSelect('number');
              onToggle(false);
              setOpen(() => false);
            }}
          >
            Number
          </DropdownListItem>
        ) : null}
        {dropDownOptions.decimal ? (
          <DropdownListItem
            onClick={() => {
              onSelect('decimal');
              onToggle(false);
              setOpen(() => false);
            }}
          >
            Decimal
          </DropdownListItem>
        ) : null}
      </DropdownList>
    </Dropdown>
  );
};

export default DropDown;
