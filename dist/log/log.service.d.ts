import { CreateLogDto, FilterLogDto } from './log.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Log, Prisma } from '@prisma/client';
import { AuthPayload, PagePayload } from '../generic/generic.payload';
import { DefaultArgs } from '@prisma/client/runtime/library';
export declare class LogService {
    private readonly prisma;
    private readonly logRepository;
    constructor(prisma: PrismaService);
    createLog(createLogDto: CreateLogDto): Promise<Log>;
    createWithTrx(createLogDto: CreateLogDto, logRepo: Prisma.LogDelegate<DefaultArgs, Prisma.PrismaClientOptions>): Promise<Log>;
    fetch(payload: AuthPayload, filterLogDto: FilterLogDto): Promise<PagePayload<Log>>;
    fetchSingle(where: any): Promise<Log>;
}
