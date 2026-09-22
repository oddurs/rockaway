import type { Decorator, Preview } from '@storybook/react-vite';
import '@fontsource-variable/inter';
import '@rockaway/css';
import '@rockaway/tokens/tokens.css';
import '../src/workbench.css';

/**
 * Mode and density are runtime contexts (cairn 0058), so the workbench switches
 * them on the root element the same way an app will.
 */
const withContexts: Decorator = (Story, { globals }) => {
  const root = document.documentElement;
  root.dataset.theme = globals.mode;
  root.dataset.density = globals.density;
  return <Story />;
};

const preview: Preview = {
  globalTypes: {
    mode: {
      description: 'Colour mode',
      toolbar: {
        title: 'Mode',
        icon: 'contrast',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
    density: {
      description: 'Density',
      toolbar: {
        title: 'Density',
        icon: 'component',
        items: [
          { value: 'compact', title: 'Compact' },
          { value: 'regular', title: 'Regular' },
          { value: 'comfortable', title: 'Comfortable' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { mode: 'light', density: 'regular' },
  decorators: [withContexts],
  parameters: {
    layout: 'centered',
    // Every story is an accessibility test: a violation fails the run.
    a11y: { test: 'error' },
  },
};

export default preview;
