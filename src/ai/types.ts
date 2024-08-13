

export interface AIProperties {
	id: number
	name: string
	valid: boolean
	folder: number
	version: number
	strict: boolean
	total_lines: number
	total_chars: number
	entrypoint: boolean
	entrypoints: any[]
	scenario: number
	includes_ids: number[]
}

export interface FolderProperties {
	id: number
	name: string
	folder: number
}

export interface AIStructure {
	ais: AIProperties[]
	folders: FolderProperties[]
	leek_ais: Map<string, number>
	bin: AIProperties[]
}