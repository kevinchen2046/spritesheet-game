
import { Bitmap } from "./bitmap";
import  { TypeAlgorithms } from "./packing";
import { FORMATS, FormatInfo } from "./format";

export type TrimRect = {
	/**裁剪X */
	x: number,
	/**裁剪Y */
	y: number,
	/**裁剪宽度 */
	width: number,
	/**裁剪高度 */
	height: number,
}
export type FileInfo = {
	path: string,
	name?: string,
	bitmap?: Bitmap,
	/**输出到画布的矩形X */
	x?: number,
	/**输出到画布的矩形Y */
	y?: number,
	/**输出到画布的矩形宽度 */
	width?: number,
	/**输出到画布的矩形高度 */
	height?: number,
	/**输出到画布的矩形面积 */
	outarea?: number,
	/**图片原始宽度 */
	originalwidth?: number,
	/**图片原始高度 */
	originalheight?: number,
	trimmed?: boolean,

	/**裁剪区域 相对原始图位置 */
	trim?: TrimRect,
	frameX?: number,
	frameY?: number,
	offsetX?: number,
	offsetY?: number,
	cocosOffsetX?: number,
	cocosOffsetY?: number,

	unpacked?: boolean,
	spritesheetWidth?: number,
	spritesheetHeight?: number,
	index?: number,

	//临时属性
	// w?: number, h?: number,
	// frameX?: number,
	// frameY?: number,
	// offsetX?: number,
	// offsetY?: number,

	cssName?: string,
	cssPriority?: number,
	isLast?: boolean
};

export type Options = {
	format?: string,
	name?: string,
	out?: string,
	fullpath?: boolean,
	square?: boolean,
	powerOfTwo?: boolean,
	scale?:string,
	/**像素边缘扩展 */
	edge?: string,
	extension?: string,
	trim?: string,
	algorithm?: string
	sort?: string,
	padding?: string,
	prefix?: string,
	divisibleByTwo?: boolean,
	cssOrder?: string,
	width?: string, height?: string,
	custom?: string
}

export type OptionsUse = {
	format?: FormatInfo,
	name?: string,
	out?: string,
	fullpath?: boolean,
	square?: boolean,
	powerOfTwo?: boolean,
	scale?:number,
	/**像素边缘扩展 */
	edge?: number,
	extension?: string,
	trim?: boolean,
	algorithm?: TypeAlgorithms
	sort?: string,
	padding?: number,
	prefix?: string,
	divisibleByTwo?: boolean,
	cssOrder?: string,
	/** */
	width?: number,
	height?: number,
	custom?: string,
	files?: FileInfo[]
}

export const EXTS = [".png", ".jpg", ".jpeg", ".gif"];