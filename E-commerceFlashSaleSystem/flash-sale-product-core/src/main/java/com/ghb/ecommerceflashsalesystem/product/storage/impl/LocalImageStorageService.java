package com.ghb.ecommerceflashsalesystem.product.storage.impl;

import com.ghb.ecommerceflashsalesystem.common.api.ResultCode;
import com.ghb.ecommerceflashsalesystem.common.exception.BusinessException;
import com.ghb.ecommerceflashsalesystem.product.storage.AbstractImageStorage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * 本地磁盘图片存储（aliyun.oss.enabled=false 或缺省时的兜底）
 *
 * 落盘目录：{storage.local.dir:uploads}/{yyyyMM}/uuid.ext（按月份分目录）
 * 访问：通过 FileStorageWebConfig 把 /uploads/** 映射到本地目录（磁盘读取，零额外成本）。
 * 返回值固定为站内相对路径 {@code /uploads/yyyyMM/uuid.ext}，由网关/前端同源代理读取；
 * 不再按请求 host 拼绝对地址（经网关转发会拿到内网 IP，浏览器无法访问）。
 */
@Slf4j
@Service
@ConditionalOnProperty(name = "aliyun.oss.enabled", havingValue = "false", matchIfMissing = true)
public class LocalImageStorageService extends AbstractImageStorage {

    @Value("${storage.local.dir:uploads}")
    private String baseDir;

    @Override
    public String store(MultipartFile file) {
        validate(file);
        String month = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMM"));
        String fileName = safeName(file.getOriginalFilename());

        Path dir = Paths.get(baseDir, month);
        try {
            Files.createDirectories(dir);
            Path target = dir.resolve(fileName);
            file.transferTo(target.toAbsolutePath());
            log.info("图片已保存到本地磁盘，path={}", target.toAbsolutePath());
        } catch (IOException e) {
            log.error("本地图片保存失败", e);
            throw new BusinessException(ResultCode.SYSTEM_ERROR, "图片保存失败，请稍后重试");
        }

        // 只返回站内相对路径：图片经网关 /uploads/** 或前端同源代理读取。
        // 曾按请求 host 拼绝对地址，经网关转发后拿到的是容器/主机内网 IP（如 172.21.112.1:8084），
        // 浏览器无法直连 8084，导致所有商品图 404。
        return "/uploads/" + month + "/" + fileName;
    }

    @Override
    public String type() {
        return "local";
    }
}
