/**
 * `Picture` (cairn 0320): a real image on the grid.
 *
 * Images are real images by default (0311): the pixels, not a terminal's
 * rendering of them. The box they sit in is the grid's: `cols` cells across,
 * or every whole cell its container gives it, and as many whole rows as the
 * image's aspect ratio makes of that width, so the picture is a block of whole
 * cells like any other and everything after it stays on the grid. The image is
 * cropped to fill the box (`object-fit: cover`), and `position` says which
 * part of it to keep.
 *
 * The rows are worked out by the stylesheet, in `round()` against the cell,
 * so a page with no script lays a picture out at its true size and nothing
 * moves when the image arrives. It needs no hook, so it is not a client
 * component: a server renders it as it is.
 *
 * The caption is text on the rows under the image, in fg.muted, wrapping at
 * its width.
 */
import type { CSSProperties, ImgHTMLAttributes, ReactNode } from 'react';
import { cx } from '../cx.ts';

export interface PictureProps
  extends Pick<
    ImgHTMLAttributes<HTMLImageElement>,
    'srcSet' | 'sizes' | 'crossOrigin' | 'referrerPolicy' | 'fetchPriority'
  > {
  readonly src: string;
  /** What the image shows, for a reader who cannot see it. Empty for a picture that is decoration. */
  readonly alt: string;
  /**
   * The image's width over its height (`16 / 9`). With `width` and `height`
   * instead, the ratio is theirs. One or the other is needed: it is what sizes
   * the box before the image arrives.
   */
  readonly ratio?: number;
  /** The image's own width, in pixels, when `ratio` is not given. */
  readonly width?: number;
  /** The image's own height, in pixels, when `ratio` is not given. */
  readonly height?: number;
  /** Its width in cells. Every whole cell its container gives it when not given. */
  readonly cols?: number;
  /** Its height in rows, cropping the image to it. From the ratio when not given. */
  readonly rows?: number;
  /** Which part of the image to keep when it is cropped, as `object-position`. */
  readonly position?: string;
  /** Text on the rows under the image. */
  readonly caption?: ReactNode;
  /** Load it when it is near the viewport (the default) or straight away. */
  readonly loading?: 'lazy' | 'eager';
  readonly className?: string;
  readonly style?: CSSProperties;
}

export function Picture({
  src,
  alt,
  ratio,
  width,
  height,
  cols,
  rows,
  position,
  caption,
  loading = 'lazy',
  className,
  style,
  ...img
}: PictureProps): ReactNode {
  const aspect = ratio ?? (width !== undefined && height ? width / height : undefined);
  const box = {
    ...(aspect === undefined ? {} : { '--rk-picture-ratio': aspect }),
    ...(cols === undefined ? {} : { '--rk-picture-cols': Math.max(1, Math.round(cols)) }),
    ...(rows === undefined
      ? {}
      : {
          '--rk-picture-height': `calc(${Math.max(1, Math.round(rows))} * var(--rk-cell-height))`,
        }),
    ...(position === undefined ? {} : { '--rk-picture-position': position }),
    ...style,
  } as CSSProperties;
  return (
    <figure className={cx('rk-picture', className)} style={box}>
      <img
        {...img}
        className="rk-picture-image"
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        {...(width === undefined ? {} : { width })}
        {...(height === undefined ? {} : { height })}
      />
      {caption === undefined ? null : (
        <figcaption className="rk-picture-caption">{caption}</figcaption>
      )}
    </figure>
  );
}
