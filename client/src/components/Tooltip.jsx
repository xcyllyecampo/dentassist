import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

export default function Tooltip({ content, children, placement = 'top', ...props }) {
  return (
    <Tippy content={content} placement={placement} arrow={true} delay={[400, 0]} {...props}>
      <span className="inline-flex">{children}</span>
    </Tippy>
  );
}
