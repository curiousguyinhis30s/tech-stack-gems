import React, { useState, useEffect, useCallback } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { Button, Select, Switch, Card, Input, Space, Tabs, Tag, message } from 'antd';
import { PlusOutlined, DeleteOutlined, SyncOutlined } from '@ant-design/icons';
import type { editor } from 'monaco-editor';

// --- Types ---

type ConditionOperator = 'eq' | 'neq' | 'gt' | 'lt' | 'contains' | 'regex';
type ValueType = 'string' | 'number' | 'boolean' | 'array';

interface Condition {
  id: string;
  attribute: string;
  operator: ConditionOperator;
  value: string | number | boolean;
}

interface Force {
  id: string;
  conditions: Condition[];
  value: any;
}

interface RolloutBucket {
  id: string;
  conditions: Condition[];
  percentage: number;
}

interface EnvironmentConfig {
  enabled: boolean;
  rules: Force[];
  rollout: RolloutBucket[];
  defaultValue: any;
}

interface FlagData {
  id: string;
  key: string;
  description: string;
  environments: {
    dev: EnvironmentConfig;
    staging: EnvironmentConfig;
    production: EnvironmentConfig;
  };
}

interface Props {
  flag: FlagData;
  onSave: (flag: FlagData) => Promise<void>;
}

// --- Helper Component: Condition Builder ---

const ConditionBuilder: React.FC<{
  condition: Condition;
  onUpdate: (c: Condition) => void;
  onRemove: () => void;
}> = ({ condition, onUpdate, onRemove }) => {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
      <Input
        placeholder="Attribute (e.g., country)"
        value={condition.attribute}
        onChange={(e) => onUpdate({ ...condition, attribute: e.target.value })}
        style={{ width: 150 }}
      />
      <Select
        value={condition.operator}
        onChange={(val) => onUpdate({ ...condition, operator: val })}
        style={{ width: 120 }}
      >
        <Select.Option value="eq">Equals</Select.Option>
        <Select.Option value="neq">Not Equals</Select.Option>
        <Select.Option value="contains">Contains</Select.Option>
        <Select.Option value="regex">Regex</Select.Option>
      </Select>
      <Input
        placeholder="Value"
        value={String(condition.value)}
        onChange={(e) => onUpdate({ ...condition, value: e.target.value })}
        style={{ flex: 1 }}
      />
      <Button
        type="text"
        danger
        icon={<DeleteOutlined />}
        onClick={onRemove}
      />
    </div>
  );
};

// --- Main Component ---

export const VisualFlagEditor: React.FC<Props> = ({ flag, onSave }) => {
  const [mode, setMode] = useState<'visual' | 'json'>('visual');
  const [activeEnv, setActiveEnv] = useState<keyof FlagData['environments']>('production');
  const [localFlag, setLocalFlag] = useState<FlagData>(JSON.parse(JSON.stringify(flag)));
  const [saving, setSaving] = useState(false);

  const handleEditorMount = useCallback((editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      schemas: [{
        uri: "http://growthbook/schema/flag",
        fileMatch: ["*"],
        schema: {
          type: "object",
          properties: {
            key: { type: "string" },
            defaultValue: { },
            enabled: { type: "boolean" }
          }
        }
      }]
    });
  }, []);

  const updateEnv = (updates: Partial<EnvironmentConfig>) => {
    setLocalFlag({
      ...localFlag,
      environments: {
        ...localFlag.environments,
        [activeEnv]: { ...localFlag.environments[activeEnv], ...updates }
      }
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (!localFlag.key) throw new Error("Flag key is required");
      await onSave(localFlag);
      message.success("Flag updated successfully");
    } catch (err) {
      message.error(`Failed to save: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const envConfig = localFlag.environments[activeEnv];

  return (
    <Card title={`Edit Flag: ${localFlag.key}`}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">

        {/* Environment Toggles */}
        <Space>
          <span>Environment:</span>
          <Select
            value={activeEnv}
            onChange={(v) => setActiveEnv(v)}
            style={{ width: 150 }}
          >
            <Select.Option value="dev">Development</Select.Option>
            <Select.Option value="staging">Staging</Select.Option>
            <Select.Option value="production">Production</Select.Option>
          </Select>

          <div style={{ marginLeft: 20 }}>
            <Switch
              checked={envConfig.enabled}
              onChange={(c) => updateEnv({ enabled: c })}
              checkedChildren="On"
              unCheckedChildren="Off"
            />
            <span style={{ marginLeft: 8 }}>Enabled in {activeEnv}</span>
          </div>
        </Space>

        {/* Mode Switcher */}
        <Tabs activeKey={mode} onChange={(key) => setMode(key as 'visual' | 'json')}>
          <Tabs.TabPane tab="Visual Builder" key="visual">
             {/* Targeting Rules Section */}
             <Card title="Targeting Rules (Overrides)" size="small" style={{ marginBottom: 16 }}>
               {envConfig.rules.map((rule, idx) => (
                 <Card key={rule.id} size="small" type="inner" style={{ marginBottom: 8 }}>
                   <Space direction="vertical" style={{ width: '100%' }}>
                     {rule.conditions.map((cond, cIdx) => (
                       <ConditionBuilder
                         key={cond.id}
                         condition={cond}
                         onUpdate={(newCond) => {
                           const newRules = [...envConfig.rules];
                           newRules[idx].conditions[cIdx] = newCond;
                           updateEnv({ rules: newRules });
                         }}
                         onRemove={() => {
                           const newRules = [...envConfig.rules];
                           newRules[idx].conditions = newRules[idx].conditions.filter(c => c.id !== cond.id);
                           updateEnv({ rules: newRules });
                         }}
                       />
                     ))}
                     <Button
                       type="dashed"
                       block
                       icon={<PlusOutlined />}
                       onClick={() => {
                         const newRules = [...envConfig.rules];
                         newRules[idx].conditions.push({
                           id: Date.now().toString(),
                           attribute: '',
                           operator: 'eq',
                           value: ''
                         });
                         updateEnv({ rules: newRules });
                       }}
                     >
                       Add Condition
                     </Button>
                   </Space>
                 </Card>
               ))}
               <Button
                 type="dashed"
                 block
                 icon={<PlusOutlined />}
                 onClick={() => updateEnv({
                   rules: [...envConfig.rules, { id: Date.now().toString(), conditions: [], value: true }]
                 })}
               >
                 Add Force Rule
               </Button>
             </Card>

             {/* Default Value */}
             <Card title="Default Value (Fallback)" size="small">
                <Input
                  value={envConfig.defaultValue === true ? 'true' : String(envConfig.defaultValue)}
                  onChange={(e) => updateEnv({ defaultValue: e.target.value })}
                />
             </Card>
          </Tabs.TabPane>

          <Tabs.TabPane tab="JSON Editor" key="json">
            <div style={{ border: '1px solid #d9d9d9', borderRadius: 6 }}>
              <Editor
                height="500px"
                defaultLanguage="json"
                value={JSON.stringify(envConfig, null, 2)}
                onChange={(value) => {
                  try {
                    if (value) updateEnv(JSON.parse(value));
                  } catch (e) {
                    // Invalid JSON, ignore
                  }
                }}
                onMount={handleEditorMount}
                theme="vs-light"
              />
            </div>
          </Tabs.TabPane>
        </Tabs>

        <Button type="primary" icon={<SyncOutlined spin={saving} />} onClick={handleSave}>
          Save Changes
        </Button>
      </Space>
    </Card>
  );
};

export default VisualFlagEditor;
