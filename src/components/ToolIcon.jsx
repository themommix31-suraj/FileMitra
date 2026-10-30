import {
  Barcode, Binary, Braces, CaseSensitive, Clock, Crop, EyeOff, FileDown, FileImage,
  FileMinus, FileOutput, FilePlus, FileText, FilesIcon, Fingerprint, Hash, ImageDown,
  Images, KeyRound, Link, Maximize, Palette, PenTool, QrCode, RefreshCcw, RotateCw,
  Scissors, ShieldOff, SlidersHorizontal, Stamp, Table, Type, Wrench, Droplets,
  ScanText, GitCompare, FileArchive, PackageOpen,
  Smartphone, Shapes, Globe, ArrowUpDown, Percent, CalendarDays, Receipt, Landmark, ListFilter,
} from 'lucide-react'

// Explicit map (rather than `import * as Icons`) so unused lucide icons are
// tree-shaken out of the production bundle.
const ICONS = {
  Barcode, Binary, Braces, CaseSensitive, Clock, Crop, EyeOff, FileDown, FileImage,
  FileMinus, FileOutput, FilePlus, FileText, FilesIcon, Fingerprint, Hash, ImageDown,
  Images, KeyRound, Link, Maximize, Palette, PenTool, QrCode, RefreshCcw, RotateCw,
  Scissors, ShieldOff, SlidersHorizontal, Stamp, Table, Type, Droplets,
  ScanText, GitCompare, FileArchive, PackageOpen,
  Smartphone, Shapes, Globe, ArrowUpDown, Percent, CalendarDays, Receipt, Landmark, ListFilter,
}

export default function ToolIcon({ name, className = 'h-5 w-5' }) {
  const Cmp = ICONS[name] || Wrench
  return <Cmp className={className} aria-hidden="true" />
}
