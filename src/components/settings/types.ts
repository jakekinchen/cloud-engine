export type SectionSchema = {
  id: string;
  title?: string;
  order?: number;
  icon?: React.ReactNode;
};

export type ControlSchemaBase = {
  id: string;
  label: string;
  sectionId?: string;
  order?: number;
  icon?: React.ReactNode;
  tooltip?: string;
  disabled?: boolean;
  accentColor?: string;
  size?: 'sm' | 'md' | 'lg';
  fullRow?: boolean;
};

export type ControlSchema = ControlSchemaBase & {
  type: string;
  render: (self: ControlSchema) => React.ReactNode;
  [key: string]: unknown; // avoid 'any' while allowing extra metadata (e.g., fullRow)
};

export type PanelProps = {
  sections: SectionSchema[];
  controls: ControlSchema[];
  className?: string;
  style?: React.CSSProperties;
  onSearch?: (q: string) => void;
  animationsEnabled?: boolean;
};


