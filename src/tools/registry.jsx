import { lazy } from 'react'

const CompressImageTool = lazy(() => import('./ui/CompressImageTool.jsx'))
const ResizeImageTool = lazy(() => import('./ui/ResizeImageTool.jsx'))
const ImageConverterTool = lazy(() => import('./ui/ImageConverterTool.jsx'))
const UniversalImageConverterTool = lazy(() => import('./ui/UniversalImageConverterTool.jsx'))
const ImagesToPdfTool = lazy(() => import('./ui/ImagesToPdfTool.jsx'))
const PdfToJpgTool = lazy(() => import('./ui/PdfToJpgTool.jsx'))
const MergePdfTool = lazy(() => import('./ui/MergePdfTool.jsx'))
const CompressPdfTool = lazy(() => import('./ui/CompressPdfTool.jsx'))
const CropImageTool = lazy(() => import('./ui/CropImageTool.jsx'))
const RotateImageTool = lazy(() => import('./ui/RotateImageTool.jsx'))
const ReduceImageQualityTool = lazy(() => import('./ui/ReduceImageQualityTool.jsx'))
const ImageToBase64Tool = lazy(() => import('./ui/ImageToBase64Tool.jsx'))
const Base64ToImageTool = lazy(() => import('./ui/Base64ToImageTool.jsx'))
const RemoveImageMetadataTool = lazy(() => import('./ui/RemoveImageMetadataTool.jsx'))
const SplitPdfTool = lazy(() => import('./ui/SplitPdfTool.jsx'))
const RotatePdfTool = lazy(() => import('./ui/RotatePdfTool.jsx'))
const PageSelectPdfTool = lazy(() => import('./ui/PageSelectPdfTool.jsx'))
const PdfToTextTool = lazy(() => import('./ui/PdfToTextTool.jsx'))
const TextToPdfTool = lazy(() => import('./ui/TextToPdfTool.jsx'))
const RepairPdfTool = lazy(() => import('./ui/RepairPdfTool.jsx'))
const PageNumbersPdfTool = lazy(() => import('./ui/PageNumbersPdfTool.jsx'))
const WatermarkPdfTool = lazy(() => import('./ui/WatermarkPdfTool.jsx'))
const CropPdfTool = lazy(() => import('./ui/CropPdfTool.jsx'))
const RedactPdfTool = lazy(() => import('./ui/RedactPdfTool.jsx'))
const SignPdfTool = lazy(() => import('./ui/SignPdfTool.jsx'))
const TextTransformTool = lazy(() => import('./ui/TextTransformTool.jsx'))
const TextStatsTool = lazy(() => import('./ui/TextStatsTool.jsx'))
const PasswordGeneratorTool = lazy(() => import('./ui/PasswordGeneratorTool.jsx'))
const UuidGeneratorTool = lazy(() => import('./ui/UuidGeneratorTool.jsx'))
const ColorConverterTool = lazy(() => import('./ui/ColorConverterTool.jsx'))
const TimestampConverterTool = lazy(() => import('./ui/TimestampConverterTool.jsx'))
const QrCodeGeneratorTool = lazy(() => import('./ui/QrCodeGeneratorTool.jsx'))
const BarcodeGeneratorTool = lazy(() => import('./ui/BarcodeGeneratorTool.jsx'))
const PdfOcrTool = lazy(() => import('./ui/PdfOcrTool.jsx'))
const TextDiffTool = lazy(() => import('./ui/TextDiffTool.jsx'))
const ZipFilesTool = lazy(() => import('./ui/ZipFilesTool.jsx'))
const UnzipFilesTool = lazy(() => import('./ui/UnzipFilesTool.jsx'))

const CompressToSizeTool = lazy(() => import('./ui/CompressToSizeTool.jsx'))
const HeicConverterTool = lazy(() => import('./ui/HeicConverterTool.jsx'))
const ImageToTextTool = lazy(() => import('./ui/ImageToTextTool.jsx'))
const SvgToPngTool = lazy(() => import('./ui/SvgToPngTool.jsx'))
const FaviconGeneratorTool = lazy(() => import('./ui/FaviconGeneratorTool.jsx'))
const OrganizePdfTool = lazy(() => import('./ui/OrganizePdfTool.jsx'))
const PercentageCalculatorTool = lazy(() => import('./ui/PercentageCalculatorTool.jsx'))
const AgeCalculatorTool = lazy(() => import('./ui/AgeCalculatorTool.jsx'))
const GstCalculatorTool = lazy(() => import('./ui/GstCalculatorTool.jsx'))
const EmiCalculatorTool = lazy(() => import('./ui/EmiCalculatorTool.jsx'))
const CaseConverterTool = lazy(() => import('./ui/CaseConverterTool.jsx'))
const RemoveDuplicateLinesTool = lazy(() => import('./ui/RemoveDuplicateLinesTool.jsx'))

// Maps a tool slug to the component that renders its working UI, plus any
// fixed props that component needs. Add a new working tool by adding one
// line here (after implementing its logic in tools/<category>/ and, if
// needed, a UI component in tools/ui/).
export const toolRegistry = {
  // ---- image tools ----
  'compress-image': { Component: CompressImageTool },
  'resize-image': { Component: ResizeImageTool },
  'image-converter': { Component: UniversalImageConverterTool },
  'jpg-to-png': { Component: ImageConverterTool, props: { fromMime: 'image/jpeg', toFormat: 'png' } },
  'png-to-jpg': { Component: ImageConverterTool, props: { fromMime: 'image/png', toFormat: 'jpeg' } },
  'jpg-to-webp': { Component: ImageConverterTool, props: { fromMime: 'image/jpeg', toFormat: 'webp' } },
  'png-to-webp': { Component: ImageConverterTool, props: { fromMime: 'image/png', toFormat: 'webp' } },
  'webp-to-jpg': { Component: ImageConverterTool, props: { fromMime: 'image/webp', toFormat: 'jpeg' } },
  'webp-to-png': { Component: ImageConverterTool, props: { fromMime: 'image/webp', toFormat: 'png' } },
  'compress-image-to-size': { Component: CompressToSizeTool },
  'compress-image-to-20kb': { Component: CompressToSizeTool, props: { presetKB: 20 } },
  'compress-image-to-50kb': { Component: CompressToSizeTool, props: { presetKB: 50 } },
  'compress-image-to-100kb': { Component: CompressToSizeTool, props: { presetKB: 100 } },
  'compress-image-to-200kb': { Component: CompressToSizeTool, props: { presetKB: 200 } },
  'heic-to-jpg': { Component: HeicConverterTool, props: { toFormat: 'jpeg' } },
  'heic-to-png': { Component: HeicConverterTool, props: { toFormat: 'png' } },
  'image-to-text': { Component: ImageToTextTool },
  'svg-to-png': { Component: SvgToPngTool },
  'favicon-generator': { Component: FaviconGeneratorTool },
  'crop-image': { Component: CropImageTool },
  'rotate-image': { Component: RotateImageTool },
  'reduce-image-quality': { Component: ReduceImageQualityTool },
  'image-to-base64': { Component: ImageToBase64Tool },
  'base64-to-image': { Component: Base64ToImageTool },
  'remove-image-metadata': { Component: RemoveImageMetadataTool },

  // ---- pdf tools ----
  'images-to-pdf': { Component: ImagesToPdfTool },
  'jpg-to-pdf': { Component: ImagesToPdfTool, props: { accept: ['image/jpeg'], acceptLabel: 'JPG images' } },
  'png-to-pdf': { Component: ImagesToPdfTool, props: { accept: ['image/png'], acceptLabel: 'PNG images' } },
  'pdf-to-jpg': { Component: PdfToJpgTool },
  'pdf-to-png': { Component: PdfToJpgTool, props: { format: 'png' } },
  'reorder-pdf-pages': { Component: OrganizePdfTool },
  'merge-pdf': { Component: MergePdfTool },
  'compress-pdf': { Component: CompressPdfTool },
  'split-pdf': { Component: SplitPdfTool },
  'rotate-pdf': { Component: RotatePdfTool },
  'delete-pdf-pages': { Component: PageSelectPdfTool, props: { mode: 'delete' } },
  'extract-pdf-pages': { Component: PageSelectPdfTool, props: { mode: 'extract' } },
  'pdf-to-text': { Component: PdfToTextTool },
  'text-to-pdf': { Component: TextToPdfTool },
  'repair-pdf': { Component: RepairPdfTool },
  'add-page-numbers': { Component: PageNumbersPdfTool },
  'pdf-add-watermark': { Component: WatermarkPdfTool },
  'crop-pdf': { Component: CropPdfTool },
  'redact-pdf': { Component: RedactPdfTool },
  'sign-pdf': { Component: SignPdfTool },
  'pdf-ocr': { Component: PdfOcrTool },

  // ---- other tools ----
  'json-formatter': { Component: TextTransformTool, props: { mode: 'json-format' } },
  'json-minifier': { Component: TextTransformTool, props: { mode: 'json-minify' } },
  'json-to-csv': { Component: TextTransformTool, props: { mode: 'json-to-csv' } },
  'csv-to-json': { Component: TextTransformTool, props: { mode: 'csv-to-json' } },
  'base64-encoder': { Component: TextTransformTool, props: { mode: 'base64-encode' } },
  'base64-decoder': { Component: TextTransformTool, props: { mode: 'base64-decode' } },
  'url-encoder': { Component: TextTransformTool, props: { mode: 'url-encode' } },
  'url-decoder': { Component: TextTransformTool, props: { mode: 'url-decode' } },
  'word-counter': { Component: TextStatsTool, props: { mode: 'words' } },
  'character-counter': { Component: TextStatsTool, props: { mode: 'characters' } },
  'password-generator': { Component: PasswordGeneratorTool },
  'uuid-generator': { Component: UuidGeneratorTool },
  'color-converter': { Component: ColorConverterTool },
  'timestamp-converter': { Component: TimestampConverterTool },
  'qr-code-generator': { Component: QrCodeGeneratorTool },
  'barcode-generator': { Component: BarcodeGeneratorTool },
  'text-diff': { Component: TextDiffTool },
  'zip-files': { Component: ZipFilesTool },
  'unzip-files': { Component: UnzipFilesTool },
  'percentage-calculator': { Component: PercentageCalculatorTool },
  'age-calculator': { Component: AgeCalculatorTool },
  'gst-calculator': { Component: GstCalculatorTool },
  'emi-calculator': { Component: EmiCalculatorTool },
  'case-converter': { Component: CaseConverterTool },
  'remove-duplicate-lines': { Component: RemoveDuplicateLinesTool },
}
