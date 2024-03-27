import React, { ChangeEventHandler, MouseEventHandler, ReactElement, useEffect, useState } from 'react';
import {
  EditorToolbarButton,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  SelectField,
  RadioButtonField,
  Pill,
  Option,
  Button,
  Icon,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { EntryAPI, FieldAPI, FieldExtensionSDK, WindowAPI } from '@contentful/app-sdk';
import { css } from 'emotion';
import List from './List';
import { Entity, InstanceParameters, Item, Tag } from '../types';
import DropDown from './Entity/DropDown';
import EntityList from './Entity/List';
import { createEntity, createItem } from '../utils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface FieldProps {
  sdk: FieldExtensionSDK;
}

/**
 * The Field component is the List App which shows up
 * in the Contentful field.
 *
 * The Field expects and uses a `Contentful JSON field`.
 */
const Field = ({ sdk }: FieldProps) => {
  const [items, setItems] = useState<Item[]>([]);
  console.log('- > Field > items:', items);
  const [dropDownOpen, setDropDownOpen] = useState(false);
  const window: WindowAPI | null = sdk.window ?? null;
  const field: FieldAPI | null = sdk.field ?? null;
  const entry: EntryAPI | null = sdk.entry ?? null;

  const isAdmin = sdk.user.spaceMembership.admin;
  const isMainLocale = field.locale === 'en-US';

  const {
    valueName = 'Value',
    keyName = 'Key',
    valueOptions = undefined,
    keyOptions = undefined,
    uniqueKeys = true,
    checkbox = false,
    taggable = false,
    dropDownOptions = 'default|entity|number|decimal',
  }: InstanceParameters = sdk.parameters?.instance ?? {};
  const itemTaggable = (item: Item) => Array.isArray(item.value) && taggable;

  useEffect(() => {
    resize();
  }, []);

  const resize = () => {
    // This ensures our app has enough space to render
    window?.startAutoResizer();

    // Every time we change the value on the field, we update internal state
    field?.onValueChanged((value: Item[]) => {
      if (Array.isArray(value)) {
        const parsedItems = value.map((item) => ({ ...item, [item.key]: item.value }));
        setItems(value);
      }
      if (!value || value?.length === 0) {
        if (!isMainLocale) field.setValue(entry.fields[field.id].getValue());
      }
    });
  };

  /** Adds another item to the list */
  const addNewItem = (type: 'string' | 'entity' | 'decimal' | 'number' = 'string') => {
    const item = createItem(type, taggable);
    // console.log('items: ', item);
    sdk.locales.available.forEach((locale) => {});

    field?.setValue([...items, item]);
  };

  /** Handle change */
  const onChange = (item: Item, val: string, property = 'value') => {
    if (property !== 'key') {
      const itemList = items.concat();
      const index = itemList.findIndex((i) => i.id === item.id);
      let value: Item['value'] = val;

      itemList.splice(index, 1, { ...item, [property]: value });

      field?.setValue(itemList);
    }
    // else = changed key field -> then change key in all other locales
    else {
      sdk.locales.available.forEach((locale) => {
        const itemList = entry.fields[field.id].getValue(locale) as Item[];
        const index = itemList.concat().findIndex((i) => i.id === item.id);
        let value: Item['value'] = val;

        itemList.splice(index, 1, { ...item, [property]: value });

        entry.fields[field.id].setValue(itemList, locale);
      });
    }
  };

  /** Deletes an item from the list */
  const deleteItem = (item: Item) => {
    sdk.locales.available.forEach((locale) => {
      const items: Item[] = entry.fields[field.id].getValue(locale);
      entry.fields[field.id].setValue(
        items.filter((i) => i.id !== item.id),
        // items.filter((i) => i.key !== item.key),
        locale
      );
    });
  };

  /** Sets checked property of an item, unsets all others */
  const setActiveOption = (item: Item) => {
    field?.setValue(
      items.map((i) => {
        i.checked = item.id === i.id;
        return i;
      })
    );
  };

  /** Removes a tag from item */
  const removeValue = (item: Item, index: number) => {
    const itemList = items.concat();
    if (Array.isArray(item.value)) {
      item.value.splice(index, 1);
      field?.setValue(itemList);
    }
  };

  const saveValue = (item: Item, entity: Entity, index: number) => {
    const itemList = items.concat();
    if (Array.isArray(item.value)) {
      item.value.splice(index, 1, entity);
      field?.setValue(itemList);
    }
  };

  const Value = (item: Item) => {
    let component;
    switch (item.type) {
      case 'entity':
        component = (
          <>
            <div
              id="entity-list-label"
              className={css({
                display: 'inline-block',
                color: '#111b2b',
                fontWeight: 500,
                marginBottom: '.5rem',
              })}
            >
              {valueName}
            </div>
            <EntityList
              items={(item as Item<'entity'>).value}
              onRemove={(_, i) => {
                removeValue(item, i);
              }}
              onSave={(entity) => {
                const toSave = (item.value as Entity[]).find((item) => item.id === entity.id);
                if (toSave) {
                  saveValue(item, entity, (item.value as Entity[]).indexOf(toSave));
                }
              }}
              onSort={(entities) => {
                const itemList = items.concat();
                itemList[itemList.indexOf(item)].value = entities;
                field?.setValue(itemList);
              }}
            >
              <Button
                size="small"
                buttonType="naked"
                icon="PlusCircle"
                onClick={() => {
                  const itemList = items.concat();
                  let id = -1;
                  if (item.value.length > 0 && id === -1) {
                    id = parseInt(
                      (item.value as Entity[]).reduce((prev, curr) => (prev.id > curr.id ? prev : curr)).id,
                      10
                    );
                  }
                  id++;
                  item.value = [...(item.value as Entity[]), createEntity({ id: String(id) })];
                  field?.setValue(itemList);
                }}
                style={{ marginTop: tokens.spacingS }}
              >
                Add Entity
              </Button>
            </EntityList>
          </>
        );
        break;
      case 'string':
      case 'number':
      case 'decimal':
      default:
        component = valueOptions ? (
          <SelectField
            onChange={(e) => onChange(item, e.target.value)}
            labelText="Options"
            name="optionSelect"
            id="optionSelect"
          >
            <Option value="" disabled>
              {valueName ? valueName : 'Select a value'}
            </Option>
            {valueOptions.split('|').map((option) => (
              <Option key={option} value={option} selected={item.value === option}>
                {option}
              </Option>
            ))}
          </SelectField>
        ) : (
          <>
            <TextField
              id="value"
              name="value"
              value={itemTaggable(item) ? '' : (item.value as string)}
              labelText={`${valueName}  (${item.type})`}
              onChange={(e) => {
                if (!itemTaggable(item)) {
                  //@ts-expect-error
                  if (item.type === 'number') onChange(item, parseInt(e.target.value, 10));
                  //@ts-expect-error
                  if (item.type === 'decimal') onChange(item, parseFloat(e.target.value));
                  if (item.type === 'string') onChange(item, e.target.value);
                }
              }}
              textInputProps={{
                onKeyDown: (e: { key: string; target: Record<string, any> }) => {
                  if (itemTaggable(item)) {
                    if (e.key === 'Enter') {
                      onChange(item, e.target.valueAsNumber);
                    }
                  }
                },
              }}
            />
            {Array.isArray(item.value) && itemTaggable(item) ? (
              <List
                items={item.value}
                onSort={(tags) => {
                  const itemList = items.concat();
                  item.value = tags;
                  field?.setValue(itemList);
                }}
              >
                {(item.value as Tag[]).map((tag, i) => (
                  <Pill
                    key={`tag-${i}`}
                    className={css({
                      marginRight: tokens.spacingS,
                      marginTop: tokens.spacingS,
                    })}
                    tabIndex={0}
                    testId="pill-item"
                    label={`${tag.key}${tag.value ? ` ➡️ ${tag.value}` : ''}`}
                    onClose={() => removeValue(item, i)}
                    onDrag={() => {}}
                  />
                ))}
              </List>
            ) : null}
          </>
        );
        break;
    }
    return component;
  };

  const Key = (item: Item, index: number, isAdmin: boolean, isMainLocale: boolean) => {
    return keyOptions ? (
      <SelectField
        onChange={(e) => onChange(item, e.target.value, 'key')}
        labelText={keyName}
        name="optionSelect"
        id="optionSelect"
      >
        <Option value="" disabled>
          {keyName ? keyName : 'Select a key'}
        </Option>
        {keyOptions.split('|').map((option) => (
          <Option
            key={option}
            disabled={uniqueKeys && items.some((i, y) => index !== y && i.key === option)}
            selected={option === item.key}
            value={option}
          >
            {option}
          </Option>
        ))}
      </SelectField>
    ) : (
      <TextField
        id="key"
        name="key"
        key={item.id}
        labelText={keyName}
        value={item.key}
        onChange={(e) => {
          onChange(item, e.target.value, 'key');
        }}
        textInputProps={{
          type: 'text',
          disabled: !isAdmin || !isMainLocale,
          error: uniqueKeys && items.some((i, y) => index !== y && i.key === item.key),
        }}
      />
    );
  };

  return (
    <div className={css({ minHeight: dropDownOpen ? 140 : undefined })}>
      <Table data-testid="list-field">
        <TableBody>
          <List
            items={items}
            onSort={(items) => {
              field?.setValue(items);
            }}
          >
            {items.map((item, index) => (
              <Row
                isMainLocale={isMainLocale}
                isAdmin={isAdmin}
                key={`field-row-${index}`}
                item={item}
                checkbox={checkbox}
                keyComponent={Key(item, index, isAdmin, isMainLocale)}
                valueComponent={Value(item)}
                select={() => {
                  setActiveOption(item);
                }}
                deleteRow={() => deleteItem(item)}
              />
            ))}
          </List>
        </TableBody>
      </Table>
      {isAdmin && isMainLocale && (
        <DropDown options={dropDownOptions} onToggle={(open) => setDropDownOpen(open)} onSelect={addNewItem} />
      )}
    </div>
  );
};

interface RowProps {
  item: Item;
  isAdmin: boolean;
  isMainLocale: boolean;
  checkbox: InstanceParameters['checkbox'];
  keyComponent: ReactElement;
  valueComponent: ReactElement;
  select: ChangeEventHandler<HTMLInputElement>;
  deleteRow: MouseEventHandler;
}

const Row = ({ item, checkbox, deleteRow, select, keyComponent, valueComponent, isAdmin, isMainLocale }: RowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? '',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={css({
        boxShadow: isDragging ? '1px 1px 15px 0px rgba(0,0,0,0.5)' : undefined,
        position: 'relative',
        zIndex: isDragging ? 99999 : 0,
      })}
    >
      <TableRow
        className={css({
          display: 'flex',
        })}
      >
        <TableCell
          align="center"
          className={css({
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            borderRight: '1px solid #cfd9e0',
            width: '1.25rem',
            backgroundColor: '#f7f9fa',
          })}
        >
          {/* <div
            {...attributes}
            {...listeners}
            className={css({
              marginRight: 7,
              marginTop: 4,
              cursor: isDragging ? 'grabbing' : 'grab',
              transition: 'all 250ms ease',
              '&:hover': {
                scale: '1.25',
              },
            })}
          >
            <Icon size="medium" color={isDragging ? 'positive' : 'muted'} icon="DragTrimmed" />
          </div> */}
          {checkbox ? (
            <RadioButtonField
              checked={item.checked}
              value="true"
              id="checkbox"
              name="checkbox"
              labelText=""
              onChange={select}
            />
          ) : null}
        </TableCell>
        <TableCell className={css({ flex: '1 1 auto', maxWidth: 320 })}>{keyComponent}</TableCell>
        <TableCell className={css({ flex: '1 1 auto', maxWidth: 320 })}>{valueComponent}</TableCell>
        {isAdmin && isMainLocale && (
          // {isAdmin && (
          <TableCell align="right">
            <EditorToolbarButton label="delete" icon="Delete" onClick={deleteRow} />
          </TableCell>
        )}
      </TableRow>
    </div>
  );
};

export default Field;
